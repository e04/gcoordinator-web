import numpy as np
import gcoordinator as gc

default_settings = {
    "Print": {
        "nozzle": {"nozzle_diameter": 1.2, "filament_diameter": 1.75},
        "layer": {"layer_height": 1.0},
        "speed": {"print_speed": 200, "travel_speed": 5000},
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

TOTAL_LAYERS = 96
LAYER_HEIGHT = default_settings["Print"]["layer"]["layer_height"]
BASE_WIDTH = 29.5
BASE_DEPTH = 2.5
LAST_WIDTH = 29.5
LAST_DEPTH = 2.5
BOTTOM_LAYERS = 1
INFILL_DISTANCE = 1.5
BOTTOM_INSET = 0
WALL_POINTS_PER_SIDE = 120

RIPPLE_WAVELENGTH = 5.0
RIPPLE_DAMPING = 0.03
RIPPLE_MAX_RATIO_TO_DEPTH = 5
RIPPLE_MIN_RADIUS = 1

RIPPLE_SOURCES = [
    {"center_x": -8.0, "center_z_ratio": 0.35, "amplitude": 1.0},
    {"center_x": 6.0, "center_z_ratio": 0.65, "amplitude": 0.8},
    {"center_x": -2.0, "center_z_ratio": 0.80, "amplitude": 0.6},
    {"center_x": 12.0, "center_z_ratio": 0.25, "amplitude": 0.7},
]


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
    k = 2.0 * np.pi / RIPPLE_WAVELENGTH

    total_offset = np.zeros_like(x)

    for src in RIPPLE_SOURCES:
        center_x = src["center_x"]
        center_z = wall_height * src["center_z_ratio"]
        amplitude = src["amplitude"]

        dx = x - center_x
        dz = z - center_z
        r = np.sqrt(dx**2 + dz**2)
        r_eff = np.maximum(r, RIPPLE_MIN_RADIUS)

        geometric_decay = 1.0 / np.sqrt(r_eff)
        viscous_decay = np.exp(-RIPPLE_DAMPING * r_eff)
        wave = np.cos(k * r_eff)

        total_offset += amplitude * geometric_decay * viscous_decay * wave

    amplitude_cap = depth * RIPPLE_MAX_RATIO_TO_DEPTH
    return np.clip(total_offset, -amplitude_cap, amplitude_cap)


def create_bottom() -> gc.Path:
    width, depth = calculate_size_at_layer(0)
    width -= BOTTOM_INSET
    depth -= BOTTOM_INSET

    x_list = []
    y_list = []
    z_list = []

    for layer_i in range(BOTTOM_LAYERS):
        z_height = (layer_i + 1) * LAYER_HEIGHT

        num_lines = int(2 * depth / INFILL_DISTANCE)
        for i in range(num_lines + 1):
            y_pos = -depth + i * INFILL_DISTANCE
            if y_pos > depth:
                y_pos = depth
            n_pts = max(int(2 * width / INFILL_DISTANCE * 2), 10)
            if i % 2 == 0:
                xs = np.linspace(-width, width, n_pts)
            else:
                xs = np.linspace(width, -width, n_pts)
            ys = np.full(n_pts, y_pos)
            zs = np.full(n_pts, z_height)
            x_list.append(xs)
            y_list.append(ys)
            z_list.append(zs)

    x = np.concatenate(x_list)
    y = np.concatenate(y_list)
    z = np.concatenate(z_list)
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
                offset = calculate_ripple_offset(x, z, depth)
                x = x + offset
            elif side == 1:
                x = width * (1 - 2 * t)
                y = depth
                offset = calculate_ripple_offset(x, z, depth)
                y = y + offset
            elif side == 2:
                x = -width
                y = depth * (1 - 2 * t)
                offset = calculate_ripple_offset(x, z, depth)
                x = x - offset
            else:
                x = width * (2 * t - 1)
                y = -depth
                offset = calculate_ripple_offset(x, z, depth)
                y = y - offset
            x_list.append(x)
            y_list.append(y)
            z_list.append(z)
    x = np.concatenate(x_list)
    y = np.concatenate(y_list)
    z = np.concatenate(z_list)
    return gc.Path(x, y, z)


full_object = []
bottom = create_bottom()
full_object.append(bottom)
wall = create_continuous_wall()
full_object.append(wall)
