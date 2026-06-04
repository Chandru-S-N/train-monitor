import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """Distance in km between two lat/lon points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def point_in_polygon(lat, lon, polygon):
    """Ray-casting algorithm for point-in-polygon test."""
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > lon) != (yj > lon)) and (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def distance_to_route(lat, lon, waypoints):
    """Minimum distance in km from a point to any waypoint on the route."""
    if not waypoints:
        return float('inf')
    min_dist = float('inf')
    for wp in waypoints:
        d = haversine_distance(lat, lon, wp[0], wp[1])
        min_dist = min(min_dist, d)
    return min_dist
