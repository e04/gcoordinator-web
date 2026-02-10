import numpy as np
import gcoordinator as gc

default_settings = {
    "Print": {
        "nozzle": {
            "nozzle_diameter": 0.8,
            "filament_diameter": 1.75
        },
        "layer": {
            "layer_height": 0.5
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
            "fan_speed": 128
        },
        "temperature": {
            "nozzle_temperature": 220,
            "bed_temperature": 50
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

TOTAL_LAYERS = 160
LAYER_HEIGHT = default_settings['Print']['layer']['layer_height']
BASE_RADIUS = 20
MAX_RADIUS = 50
PEAK_LAYER = 80
SMOOTHNESS = 0.4
WAVE_AMPLITUDE = 1.2
WAVE_FREQUENCY = 50
WAVE_PHASE_SHIFT = 0.5
BOTTOM_LAYERS = 1
SPIRAL_POINTS_PER_TURN = 120
INFILL_DISTANCE = 1.2
WALL_POINTS_PER_LAYER = 720
WALL_SKIP_START_LAYERS = 3
WALL_SKIP_END_LAYERS = 3
SKIRT_OFFSET = 20
SKIRT_POINTS = 200

def calculate_radius_at_layer(layer: float) -> float:
    if isinstance(layer, np.ndarray):
        angle = np.where(
            layer <= PEAK_LAYER,
            (layer / PEAK_LAYER) * (np.pi / 2),
            (np.pi / 2) + ((layer - PEAK_LAYER) / (TOTAL_LAYERS - PEAK_LAYER)) * (np.pi / 2)
        )
    else:
        if layer <= PEAK_LAYER:
            angle = (layer / PEAK_LAYER) * (np.pi / 2)
        else:
            angle = (np.pi / 2) + ((layer - PEAK_LAYER) / (TOTAL_LAYERS - PEAK_LAYER)) * (np.pi / 2)
    shape_factor = np.power(np.sin(angle), SMOOTHNESS)
    return BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * shape_factor

def calculate_wall_start_radius() -> float:
    return calculate_radius_at_layer(BOTTOM_LAYERS)

def create_skirt_path() -> gc.Path:
    angles = np.linspace(0, 2 * np.pi, SKIRT_POINTS)
    radius = calculate_wall_start_radius() + WAVE_AMPLITUDE + SKIRT_OFFSET
    x = radius * np.cos(angles)
    y = radius * np.sin(angles)
    z = np.full_like(angles, LAYER_HEIGHT)
    return gc.Path(x, y, z)

def create_spiral_bottom() -> gc.Path:
    wall_start_layer = BOTTOM_LAYERS + WALL_SKIP_START_LAYERS
    max_radius = calculate_radius_at_layer(wall_start_layer) + WAVE_AMPLITUDE
    num_turns = int(max_radius / INFILL_DISTANCE)
    total_points = num_turns * SPIRAL_POINTS_PER_TURN
    theta = np.linspace(0, 2 * np.pi * num_turns, total_points)
    r = np.linspace(0, max_radius, total_points)
    x = r * np.cos(theta)
    y = r * np.sin(theta)
    z = np.full_like(theta, LAYER_HEIGHT)
    return gc.Path(x, y, z)

def create_continuous_wave_wall() -> gc.Path:
    start_layer = BOTTOM_LAYERS + WALL_SKIP_START_LAYERS
    end_layer = TOTAL_LAYERS - WALL_SKIP_END_LAYERS
    wall_layers = end_layer - start_layer
    if wall_layers <= 0:
        return gc.Path(np.array([0]), np.array([0]), np.array([0]))
    total_points = WALL_POINTS_PER_LAYER * wall_layers
    theta = np.linspace(0, 2 * np.pi * wall_layers, total_points)
    z = np.linspace((BOTTOM_LAYERS + 1) * LAYER_HEIGHT, (BOTTOM_LAYERS + 1 + wall_layers) * LAYER_HEIGHT, total_points)
    layer_progress = np.linspace(start_layer, end_layer, total_points)
    expanding_radius = calculate_radius_at_layer(layer_progress)
    wave_angle = theta * (WAVE_FREQUENCY + WAVE_PHASE_SHIFT)
    radius = expanding_radius + WAVE_AMPLITUDE * np.cos(wave_angle)
    x = radius * np.cos(theta)
    y = radius * np.sin(theta)
    return gc.Path(x, y, z)

full_object = []
skirt = create_skirt_path()
full_object.append(skirt)
bottom = create_spiral_bottom()
full_object.append(bottom)
wave_wall = create_continuous_wave_wall()
full_object.append(wave_wall)
