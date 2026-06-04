import urllib.request
import json
import time
from django.core.management.base import BaseCommand
from apps.trains.models import Train
from apps.users.models import User
from apps.geofencing.models import Route

def fetch_osrm_route(waypoints, train_id):
    """
    Fetch detailed routing coordinates between waypoints using the public OSRM API.
    Waypoints: List of [lat, lon] or (lat, lon)
    Returns: List of [lat, lon]
    """
    if len(waypoints) < 2:
        return waypoints

    # OSRM expects: lon,lat;lon,lat;...
    coords_str = ";".join([f"{wp[1]},{wp[0]}" for wp in waypoints])
    url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
    
    print(f"  Fetching real route for {train_id} from OSRM...")
    # Try up to 3 times
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'SmartTrainMonitor/1.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                if data.get('code') == 'Ok':
                    geometry_coords = data['routes'][0]['geometry']['coordinates']
                    # convert [lon, lat] back to [lat, lon]
                    routed_points = [[coord[1], coord[0]] for coord in geometry_coords]
                    if len(routed_points) > 0:
                        print(f"    Success: fetched {len(routed_points)} routing coordinates.")
                        return routed_points
                elif data.get('code') == 'NoRoute':
                    print(f"    No route found for {train_id} on attempt {attempt+1}")
        except Exception as e:
            print(f"    [OSRM Warning] Attempt {attempt+1} failed: {e}")
            time.sleep(1.0)
            
    print("    [OSRM Info] Falling back to straight-line waypoints.")
    return waypoints


DEMO_TRAINS = [
    {
        'id': 'TN-001',
        'name': 'Rajdhani Express',
        'route_name': 'Mumbai CST \u2192 New Delhi',
        'description': "India's premium overnight express connecting financial and political capitals",
        'status': 'active',
        'waypoints': [
            [19.0760, 72.8777], [20.5937, 72.9942], [21.1702, 72.8311],
            [22.3072, 73.1812], [23.3342, 75.0370], [24.5854, 73.7125],
            [25.2138, 75.8648], [26.9124, 75.7873], [28.7041, 77.1025],
        ],
    },
    {
        'id': 'TN-002',
        'name': 'Chennai Express',
        'route_name': 'Mumbai LTT \u2192 Chennai Central',
        'description': 'Popular long-distance express connecting Mumbai to Chennai via Deccan plateau',
        'status': 'active',
        'waypoints': [
            [19.0760, 72.8777], [18.9220, 73.1228], [18.5204, 73.8567],
            [17.6868, 75.9065], [17.3297, 76.8343], [16.3088, 77.3872],
            [15.8281, 78.0373], [14.4426, 79.9865], [13.0827, 80.2707],
        ],
    },
    {
        'id': 'TN-003',
        'name': 'Deccan Queen',
        'route_name': 'Pune \u2192 Mumbai CST',
        'description': 'Historic intercity express running through the Western Ghats',
        'status': 'active',
        'waypoints': [
            [18.5204, 73.8567], [18.6161, 73.7278], [18.7481, 73.4072],
            [18.9126, 73.3174], [18.9908, 73.1124], [19.0760, 72.8777],
        ],
    },
    {
        'id': 'TN-004',
        'name': 'Shatabdi Express',
        'route_name': 'Bangalore \u2192 Chennai Central',
        'description': 'High-speed intercity superfast connecting two southern tech hubs',
        'status': 'active',
        'waypoints': [
            [12.9716, 77.5946], [12.8253, 77.6672], [12.9684, 79.1446],
            [13.0827, 79.6728], [13.0952, 80.1095], [13.0827, 80.2707],
        ],
    },
    {
        'id': 'TN-005',
        'name': 'Duronto Express',
        'route_name': 'Kolkata \u2192 New Delhi',
        'description': 'Non-stop superfast express spanning Eastern to Northern India',
        'status': 'active',
        'waypoints': [
            [22.5726, 88.3639], [23.2599, 87.0888], [23.7957, 86.4304],
            [24.7914, 85.0002], [25.4358, 81.8463], [26.4499, 80.3319],
            [27.1767, 78.0081], [28.4089, 77.3178], [28.7041, 77.1025],
        ],
    },
]

DEMO_USERS = [
    {'username': 'admin', 'email': 'admin@trainmonitor.com', 'password': 'Admin@123', 'role': 'admin'},
    {'username': 'operator1', 'email': 'operator@trainmonitor.com', 'password': 'Operator@123', 'role': 'operator'},
    {'username': 'maintenance1', 'email': 'maintenance@trainmonitor.com', 'password': 'Maint@123', 'role': 'maintenance'},
]

class Command(BaseCommand):
    help = 'Seed demo data: trains, routes, and users'

    def handle(self, *args, **kwargs):
        for train_data in DEMO_TRAINS:
            waypoints = train_data.pop('waypoints')
            # Fetch detailed route coordinates using OSRM API
            routed_waypoints = fetch_osrm_route(waypoints, train_data['id'])
            
            train, created = Train.objects.get_or_create(
                id=train_data['id'], defaults=train_data
            )
            if not created:
                for k, v in train_data.items():
                    setattr(train, k, v)
                train.save()
            Route.objects.update_or_create(
                train=train,
                defaults={'waypoints': routed_waypoints}
            )
            self.stdout.write(f'  Train: {train.name} (Route waypoints: {len(routed_waypoints)})')
            train_data['waypoints'] = waypoints


        for ud in DEMO_USERS:
            if not User.objects.filter(email=ud['email']).exists():
                user = User.objects.create_user(
                    username=ud['username'],
                    email=ud['email'],
                    password=ud['password'],
                    role=ud['role'],
                )
                if ud['role'] == 'admin':
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
                self.stdout.write(f'  User: {ud["email"]} ({ud["role"]})')

        self.stdout.write(self.style.SUCCESS('[SUCCESS] Demo data seeded successfully!'))
        self.stdout.write('Login credentials:')
        for ud in DEMO_USERS:
            self.stdout.write(f'  {ud["role"]}: {ud["email"]} / {ud["password"]}')
