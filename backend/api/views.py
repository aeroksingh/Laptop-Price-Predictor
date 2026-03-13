import logging
import os
import pickle
from typing import Any, Dict

import numpy as np
import pandas as pd
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
import re
from math import sqrt


logger = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def _safe_float(val: Any) -> float:
    if val is None:
        return np.nan
    try:
        # remove common non-numeric characters (e.g. 'kg', 'inches')
        s = str(val).strip()
        # replace commas and non-digit/period characters
        cleaned = ''.join(c for c in s if (c.isdigit() or c == '.' or c == '-'))
        if cleaned == '' or cleaned == '-' or cleaned == '.':
            return np.nan
        return float(cleaned)
    except Exception:
        return np.nan


def _safe_int_from_memorylike(val: Any) -> Any:
    if val is None:
        return np.nan
    try:
        s = str(val)
        cleaned = ''.join(c for c in s if c.isdigit())
        return int(cleaned) if cleaned != '' else np.nan
    except Exception:
        return np.nan


def _load_pickle(filename: str):
    path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing model file: {path}")
    with open(path, 'rb') as f:
        return pickle.load(f)


# Try to load a single pipeline that does preprocessing + prediction.
try:
    pipeline = _load_pickle('pipe.pkl')
    model = None
except Exception:
    pipeline = None
    model = None

try:
    # if there's a separate model file, prefer to load it
    if model is None:
        model = _load_pickle('model.pkl')
except Exception:
    # it's acceptable if model.pkl doesn't exist when pipe.pkl is a full pipeline
    pass


@api_view(['POST'])
def predict(request):
    try:
        data: Dict[str, Any] = request.data if isinstance(request.data, dict) else {}

        # build a single-row DataFrame with the expected columns
        row = {
            'Company': data.get('Company'),
            'TypeName': data.get('TypeName'),
            'Inches': _safe_float(data.get('Inches')),
            'ScreenResolution': data.get('ScreenResolution'),
            'Cpu': data.get('Cpu'),
            'Ram': _safe_int_from_memorylike(data.get('Ram')),
            'Memory': data.get('Memory'),
            'Gpu': data.get('Gpu'),
            'OpSys': data.get('OpSys'),
            'Weight': _safe_float(data.get('Weight')),
        }

        df = pd.DataFrame([row])

        # Ensure pipeline has required derived columns; provide safe defaults
        # Touchscreen / IPS flags default to 0
        df['Touchscreen'] = 0
        df['IPS'] = 0
        # Some pipelines expect 'Ips' (different capitalization); mirror it
        df['Ips'] = df['IPS']

        # Parse Memory to detect SSD/HDD presence
        mem = str(row.get('Memory') or '').lower()
        df['SSD'] = 1 if 'ssd' in mem else 0
        df['HDD'] = 1 if 'hdd' in mem else 0

        # Pass the full CPU/GPU strings that match training data
        # (encoders usually expect the full model strings like 'Intel Core i7')
        df['Cpu brand'] = row.get('Cpu') or ''
        df['Gpu brand'] = row.get('Gpu') or ''

        # os column: provide normalized value
        df['os'] = row.get('OpSys') or ''

        # compute ppi from ScreenResolution and Inches if possible
        res = str(row.get('ScreenResolution') or '')
        # try to extract two integers like 1920x1080
        match = re.search(r"(\d{3,4})\s*[xX]\s*(\d{3,4})", res)
        try:
            inches = float(df.at[0, 'Inches'])
        except Exception:
            inches = None

        if match and inches and inches > 0:
            try:
                x = int(match.group(1))
                y = int(match.group(2))
                ppi = sqrt(x * x + y * y) / inches
                df['ppi'] = ppi
            except Exception:
                df['ppi'] = np.nan
        else:
            df['ppi'] = np.nan

        # ensure any other commonly-expected columns exist as safe defaults
        for c in ['Touchscreen', 'IPS', 'Ips', 'SSD', 'HDD', 'Cpu brand', 'Gpu brand', 'ppi', 'os']:
            if c not in df.columns:
                df[c] = 0

        # Prediction logic: either use pipeline.predict(df) or pipeline.transform + model.predict
        if pipeline is not None and hasattr(pipeline, 'predict'):
            preds = pipeline.predict(df)
        elif pipeline is not None and model is not None:
            transformed = pipeline.transform(df)
            preds = model.predict(transformed)
        elif model is not None and hasattr(model, 'predict'):
            # assume df is already numeric or model pipeline is not needed
            preds = model.predict(df)
        else:
            logger.error('No pipeline or model available for prediction')
            return Response({'error': 'Model not found on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Ensure we return a simple float
        pred_value = float(np.exp(np.array(preds).flatten()[0]))
        return Response({'prediction': pred_value}, status=status.HTTP_200_OK)

    except FileNotFoundError as fnf:
        logger.exception('Model file missing')
        return Response({'error': str(fnf)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as exc:
        logger.exception('Prediction error')
        return Response({'error': 'Prediction failed', 'details': str(exc)}, status=status.HTTP_400_BAD_REQUEST)