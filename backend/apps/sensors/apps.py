from django.apps import AppConfig
import sys
import os
import threading
import time

class SensorsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sensors'

    def ready(self):
        # Avoid starting simulator in management commands (migrations, seeding, shell)
        has_runserver = any('runserver' in arg for arg in sys.argv)
        has_daphne = any('daphne' in arg for arg in sys.argv)
        if not has_runserver and not has_daphne:
            return

        # Prevent double-starting when Django development server reloader runs
        if has_runserver and os.environ.get('RUN_MAIN') != 'true':
            return

        # Start the background thread if Redis/Celery is not used, or if IN_PROCESS_SIMULATOR is explicitly enabled
        from django.conf import settings
        if settings.SIMULATOR_ENABLED and (not settings.REDIS_HOST or os.environ.get('IN_PROCESS_SIMULATOR') == 'true'):
            thread = threading.Thread(target=self.start_local_simulator, daemon=True)
            thread.start()

    def start_local_simulator(self):
        print("[SYSTEM] Starting local in-process IoT simulator thread...")
        time.sleep(5.0)  # Wait for server initialization
        from apps.sensors.tasks import simulate_sensor_data
        from apps.alerts.tasks import check_alerts
        
        while True:
            try:
                simulate_sensor_data()
                check_alerts()
            except Exception as e:
                print(f"[SIMULATOR ERROR] {e}")
            time.sleep(3.0)
