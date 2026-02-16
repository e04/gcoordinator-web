import numpy as np
import gcoordinator as gc

default_settings = {
    "Print": {
        "nozzle": {"nozzle_diameter": 1.2, "filament_diameter": 1.75},
        "layer": {"layer_height": 1.0},
        "speed": {"print_speed": 100, "travel_speed": 5000},
        "origin": {"x": 90, "y": 90},
        "fan_speed": {"fan_speed": 0},
        "temperature": {"nozzle_temperature": 270, "bed_temperature": 80},
        "travel_option": {
            "retraction": False,
            "retraction_distance": 2.0,
            "unretraction_distance": 2.0,
            "z_hop": False,
            "z_hop_distance": 3,
        },
        "extrusion_option": {"extrusion_multiplier": 1.5},
    },
    "Hardware": {
        "kinematics": "Cartesian",
        "bed_size": {"bed_size_x": 180, "bed_size_y": 180, "bed_size_z": 180},
    },
}

gc.set_settings(default_settings)

TOTAL_LAYERS = 100
LAYER_HEIGHT = default_settings["Print"]["layer"]["layer_height"]
BASE_WIDTH = 50
BASE_DEPTH = 6
LAST_WIDTH = 50
LAST_DEPTH = 6
BOTTOM_LAYERS = 1
INFILL_DISTANCE = 1.2
BOTTOM_INSET = 0
WALL_POINTS_PER_SIDE = 120
SKIRT_OFFSET = 5
SKIRT_POINTS = 200

SPHERE_RADIUS = 100
SPHERE_DISTANCE = 90


def calculate_size_at_layer(layer: float) -> tuple:
    progress = layer / TOTAL_LAYERS
    width = BASE_WIDTH + (LAST_WIDTH - BASE_WIDTH) * progress
    depth = BASE_DEPTH + (LAST_DEPTH - BASE_DEPTH) * progress
    return width, depth


def calculate_wall_start_size() -> tuple:
    return calculate_size_at_layer(BOTTOM_LAYERS)


def create_rect_path(
    width: float, depth: float, z_height: float, points_per_side: int
) -> tuple:
    x_list = []
    y_list = []
    x_list.append(np.full(points_per_side, width))
    y_list.append(np.linspace(-depth, depth, points_per_side))
    x_list.append(np.linspace(width, -width, points_per_side))
    y_list.append(np.full(points_per_side, depth))
    x_list.append(np.full(points_per_side, -width))
    y_list.append(np.linspace(depth, -depth, points_per_side))
    x_list.append(np.linspace(-width, width, points_per_side))
    y_list.append(np.full(points_per_side, -depth))
    x = np.concatenate(x_list)
    y = np.concatenate(y_list)
    z = np.full_like(x, z_height)
    return x, y, z


def calculate_sphere_offset(
    x: np.ndarray, z: np.ndarray, depth: np.ndarray
) -> np.ndarray:
    wall_height = TOTAL_LAYERS * LAYER_HEIGHT
    sphere_center_x = 0.0
    sphere_center_y = depth + SPHERE_DISTANCE
    sphere_center_z = wall_height / 2.0

    dx = x - sphere_center_x
    dz = z - sphere_center_z
    dist_xz = np.sqrt(dx**2 + dz**2)

    offset = np.zeros_like(x)
    inside = dist_xz < SPHERE_RADIUS
    if np.any(inside):
        sphere_surface_y = np.sqrt(
            np.maximum(SPHERE_RADIUS**2 - dist_xz[inside] ** 2, 0)
        )
        penetration = sphere_surface_y - SPHERE_DISTANCE
        offset[inside] = -np.maximum(penetration, 0)

    return offset


def create_continuous_wall() -> gc.Path:
    wall_layers = TOTAL_LAYERS - BOTTOM_LAYERS
    points_per_side = WALL_POINTS_PER_SIDE
    x_list = []
    y_list = []
    z_list = []
    for layer in range(wall_layers):
        current_layer = BOTTOM_LAYERS + layer
        next_layer = BOTTOM_LAYERS + layer + 1
        width_start, depth_start = calculate_size_at_layer(current_layer)
        width_end, depth_end = calculate_size_at_layer(next_layer)
        z_start = current_layer * LAYER_HEIGHT
        z_end = next_layer * LAYER_HEIGHT
        for side in range(4):
            t = np.linspace(0, 1, points_per_side)
            progress = (side + t) / 4
            width = width_start + (width_end - width_start) * progress
            depth = depth_start + (depth_end - depth_start) * progress
            z = z_start + (z_end - z_start) * progress
            if side == 0:
                x = width
                y = depth * (2 * t - 1)
            elif side == 1:
                x = width * (1 - 2 * t)
                y = depth
            elif side == 2:
                x = -width
                y = depth * (1 - 2 * t)
            else:
                x = width * (2 * t - 1)
                y = -depth - calculate_sphere_offset(x, z, depth)
            x_list.append(x)
            y_list.append(y)
            z_list.append(z)
    x = np.concatenate(x_list)
    y = np.concatenate(y_list)
    z = np.concatenate(z_list)
    return gc.Path(x, y, z)


full_object = []
wall = create_continuous_wall()
full_object.append(wall)
