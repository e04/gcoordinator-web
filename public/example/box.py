import numpy as np
import gcoordinator as gc

default_settings = {
    "Print": {
        "nozzle": {
            "nozzle_diameter": 1.2,
            "filament_diameter": 1.75
        },
        "layer": {
            "layer_height": 1.0
        },
        "speed": {
            "print_speed": 1000,
            "travel_speed": 5000
        },
        "origin": {
            "x": 90,
            "y": 90
        },
        "fan_speed": {
            "fan_speed": 0
        },
        "temperature": {
            "nozzle_temperature": 250,
            "bed_temperature": 75
        },
        "travel_option": {
            "retraction": False,
            "retraction_distance": 2.0,
            "unretraction_distance": 2.0,
            "z_hop": False,
            "z_hop_distance": 3
        },
        "extrusion_option": {
            "extrusion_multiplier": 1.0
        }
    },
    "Hardware": {
        "kinematics": "Cartesian",
        "bed_size": {
            "bed_size_x": 180,
            "bed_size_y": 180,
            "bed_size_z": 180
        }
    }
}

gc.set_settings(default_settings)

TOTAL_LAYERS = 20
LAYER_HEIGHT = 1.0
BASE_WIDTH = 35
BASE_DEPTH = 20
LAST_WIDTH = 35
LAST_DEPTH = 20
BOTTOM_LAYERS = 1
INFILL_DISTANCE = 2
BOTTOM_INSET = 0
WALL_POINTS_PER_SIDE = 2
SKIRT_OFFSET = 5
SKIRT_POINTS = 200

def calculate_size_at_layer(layer: float) -> tuple:
    progress = layer / TOTAL_LAYERS
    width = BASE_WIDTH + (LAST_WIDTH - BASE_WIDTH) * progress
    depth = BASE_DEPTH + (LAST_DEPTH - BASE_DEPTH) * progress
    return width, depth

def calculate_wall_start_size() -> tuple:
    return calculate_size_at_layer(BOTTOM_LAYERS)

def create_rect_path(width: float, depth: float, z_height: float, points_per_side: int) -> tuple:
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

def create_skirt_path() -> gc.Path:
    width, depth = calculate_wall_start_size()
    width += SKIRT_OFFSET
    depth += SKIRT_OFFSET
    points_per_side = SKIRT_POINTS // 4
    x, y, z = create_rect_path(width, depth, LAYER_HEIGHT, points_per_side)
    return gc.Path(x, y, z)

def create_zigzag_bottom() -> gc.Path:
    max_width, max_depth = calculate_wall_start_size()
    max_width -= BOTTOM_INSET
    max_depth -= BOTTOM_INSET
    num_lines = int(2 * max_width / INFILL_DISTANCE) + 1
    x_list = []
    y_list = []
    for i in range(num_lines):
        x_pos = -max_width + i * INFILL_DISTANCE
        if x_pos > max_width:
            x_pos = max_width
        if i % 2 == 0:
            x_list.extend([x_pos, x_pos])
            y_list.extend([-max_depth, max_depth])
        else:
            x_list.extend([x_pos, x_pos])
            y_list.extend([max_depth, -max_depth])
    x = np.array(x_list)
    y = np.array(y_list)
    z = np.full_like(x, LAYER_HEIGHT)
    return gc.Path(x, y, z)

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
                y = -depth
            x_list.append(x)
            y_list.append(y)
            z_list.append(z)
    x = np.concatenate(x_list)
    y = np.concatenate(y_list)
    z = np.concatenate(z_list)
    return gc.Path(x, y, z)

full_object = []
skirt = create_skirt_path()
full_object.append(skirt)
bottom = create_zigzag_bottom()
full_object.append(bottom)
wall = create_continuous_wall()
full_object.append(wall)
