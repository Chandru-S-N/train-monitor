import os
from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-trainmonitor-secret-key-2024')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'django_filters',
    'apps.users',
    'apps.trains',
    'apps.sensors',
    'apps.alerts',
    'apps.geofencing',
    'apps.reports',
    'apps.maintenance',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DATABASE_URL = config('DATABASE_URL', default='')
if DATABASE_URL:
    from urllib.parse import urlparse
    url = urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 5432,
        }
    }
    if url.hostname and ('neon' in url.hostname or config('DB_SSL', default=True, cast=bool)):
        DATABASES['default']['OPTIONS'] = {
            'sslmode': 'require',
        }
elif config('DB_ENGINE', default='sqlite') == 'postgres':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='trainmonitor'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default='postgres'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

REDIS_URL = config('REDIS_URL', default='')
if REDIS_URL:
    from urllib.parse import urlparse
    url = urlparse(REDIS_URL)
    REDIS_HOST = url.hostname or ''
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [REDIS_URL],
            },
        },
    }
    if REDIS_URL.startswith('rediss://') and 'ssl_cert_reqs' not in REDIS_URL:
        separator = '&' if '?' in REDIS_URL else '?'
        celery_redis_url = f"{REDIS_URL}{separator}ssl_cert_reqs=none"
    else:
        celery_redis_url = REDIS_URL
    CELERY_BROKER_URL = celery_redis_url
    CELERY_RESULT_BACKEND = celery_redis_url
else:
    REDIS_HOST = config('REDIS_HOST', default='')
    if REDIS_HOST:
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {
                    'hosts': [(REDIS_HOST, int(config('REDIS_PORT', default=6379)))],
                },
            },
        }
        CELERY_BROKER_URL = f"redis://{REDIS_HOST}:{config('REDIS_PORT', default=6379)}/0"
        CELERY_RESULT_BACKEND = CELERY_BROKER_URL
    else:
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels.layers.InMemoryChannelLayer',
            },
        }
        CELERY_BROKER_URL = 'memory://'
        CELERY_RESULT_BACKEND = 'memory://'

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'

from celery.schedules import crontab
CELERY_BEAT_SCHEDULE = {
    'iot-simulator': {
        'task': 'apps.sensors.tasks.simulate_sensor_data',
        'schedule': 3.0,
    },
    'check-alerts': {
        'task': 'apps.alerts.tasks.check_alerts',
        'schedule': 5.0,
    },
    'cleanup-old-data': {
        'task': 'apps.sensors.tasks.cleanup_old_data',
        'schedule': 3600.0,
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
        'rest_framework.filters.SearchFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL', default=True, cast=bool)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'https://train-monitor-backend.onrender.com',
    'https://train-monitor-web.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('FROM_EMAIL', default='noreply@trainmonitor.com')

# Alert thresholds
ALERT_THRESHOLDS = {
    'temperature': {'medium': 70, 'high': 80, 'critical': 100},
    'pressure': {'medium': 130, 'high': 150, 'critical': 200},
    'vibration': {'medium': 5, 'high': 7, 'critical': 12},
    'smoke': {'medium': 30, 'high': 50, 'critical': 100},
}

# MQTT Broker Settings
MQTT_BROKER_HOST = config('MQTT_BROKER_HOST', default='localhost')
MQTT_BROKER_PORT = config('MQTT_BROKER_PORT', default=1883, cast=int)
MQTT_USERNAME = config('MQTT_USERNAME', default=None)
MQTT_PASSWORD = config('MQTT_PASSWORD', default=None)
MQTT_TOPIC = config('MQTT_TOPIC', default='trains/+/telemetry')
SIMULATOR_ENABLED = config('SIMULATOR_ENABLED', default=True, cast=bool)
