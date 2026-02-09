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

TOTAL_LAYERS = 50
LAYER_HEIGHT = default_settings['Print']['layer']['layer_height']
BASE_RADIUS = 40
LAST_RADIUS = 40
BOTTOM_LAYERS = 2
SPIRAL_POINTS_PER_TURN = 120
INFILL_DISTANCE = 2.0
WALL_POINTS_PER_LAYER = 720
SKIRT_OFFSET = 5
SKIRT_POINTS = 200

def calculate_radius_at_layer(layer: float) -> float:
    return BASE_RADIUS + (LAST_RADIUS - BASE_RADIUS) * (layer / TOTAL_LAYERS)

def calculate_wall_start_radius() -> float:
    return calculate_radius_at_layer(BOTTOM_LAYERS)

def create_skirt_path() -> gc.Path:
    angles = np.linspace(0, 2 * np.pi, SKIRT_POINTS)
    radius = calculate_wall_start_radius() + SKIRT_OFFSET
    return gc.Path(
        radius * np.cos(angles),
        radius * np.sin(angles),
        np.full_like(angles, LAYER_HEIGHT),
    )

def create_bottom_infill() -> list[gc.Path]:
    radius = calculate_wall_start_radius()
    angles = np.linspace(0, 2 * np.pi, WALL_POINTS_PER_LAYER)
    x = radius * np.cos(angles)
    y = radius * np.sin(angles)
    return [
        gc.line_infill(
            gc.Path(x, y, np.full_like(angles, (i + 1) * LAYER_HEIGHT)),
            infill_distance=INFILL_DISTANCE,
            angle=0 if i % 2 == 0 else np.pi / 2,
        )
        for i in range(BOTTOM_LAYERS)
    ]

def create_bottom_walls() -> list[gc.Path]:
    angles = np.linspace(0, 2 * np.pi, WALL_POINTS_PER_LAYER)
    return [
        gc.Path(
            calculate_radius_at_layer(i + 1) * np.cos(angles),
            calculate_radius_at_layer(i + 1) * np.sin(angles),
            np.full_like(angles, (i + 1) * LAYER_HEIGHT),
        )
        for i in range(BOTTOM_LAYERS)
    ]

def create_continuous_wall() -> gc.Path:
    wall_layers = TOTAL_LAYERS - BOTTOM_LAYERS
    total_points = WALL_POINTS_PER_LAYER * wall_layers
    theta = np.linspace(0, 2 * np.pi * wall_layers, total_points)
    z = np.linspace(BOTTOM_LAYERS * LAYER_HEIGHT, TOTAL_LAYERS * LAYER_HEIGHT, total_points)
    radius = calculate_radius_at_layer(np.linspace(BOTTOM_LAYERS, TOTAL_LAYERS, total_points))
    return gc.Path(radius * np.cos(theta), radius * np.sin(theta), z)

full_object = [
    create_skirt_path(),
    *create_bottom_walls(),
    *create_bottom_infill(),
    create_continuous_wall(),
]
