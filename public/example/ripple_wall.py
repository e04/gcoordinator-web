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
BASE_DEPTH = 5
LAST_WIDTH = 50
LAST_DEPTH = 5
BOTTOM_LAYERS = 1
INFILL_DISTANCE = 1.2
BOTTOM_INSET = 0
WALL_POINTS_PER_SIDE = 120

RIPPLE_AMPLITUDE = 10.0
RIPPLE_WAVELENGTH = 10.0
RIPPLE_DAMPING = 0.03
RIPPLE_CENTER_X = 0.0
RIPPLE_CENTER_Z_RATIO = 0.5
RIPPLE_MAX_RATIO_TO_DEPTH = 5
RIPPLE_MIN_RADIUS = 4.0


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


def calculate_ripple_offset(
    x: np.ndarray, z: np.ndarray, depth: np.ndarray
) -> np.ndarray:
    wall_height = TOTAL_LAYERS * LAYER_HEIGHT
    center_z = wall_height * RIPPLE_CENTER_Z_RATIO

    dx = x - RIPPLE_CENTER_X
    dz = z - center_z
    r = np.sqrt(dx**2 + dz**2)

    r_eff = np.maximum(r, RIPPLE_MIN_RADIUS)

    k = 2.0 * np.pi / RIPPLE_WAVELENGTH

    geometric_decay = 1.0 / np.sqrt(r_eff)
    viscous_decay = np.exp(-RIPPLE_DAMPING * r_eff)
    wave = np.cos(k * r_eff)

    raw_offset = RIPPLE_AMPLITUDE * geometric_decay * viscous_decay * wave

    amplitude_cap = depth * RIPPLE_MAX_RATIO_TO_DEPTH
    return np.clip(raw_offset, -amplitude_cap, amplitude_cap)


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
                y = -depth - calculate_ripple_offset(x, z, depth)
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
