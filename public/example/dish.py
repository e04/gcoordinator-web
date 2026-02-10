import numpy as np
import gcoordinator as gc

TOTAL_LAYERS = 50
LAYER_HEIGHT = 0.8
BASE_RADIUS = 20
LAST_RADIUS = 50
WAVE_AMPLITUDE = 2
WAVE_FREQUENCY = 40
WAVE_PHASE_SHIFT = 0.5
SPIRAL_POINTS_PER_TURN = 120
INFILL_DISTANCE = 0.8
WALL_POINTS_PER_LAYER = 720
SKIRT_OFFSET = 5
SKIRT_POINTS = 200


def calculate_radius_at_layer(layer: float) -> float:
    progress = layer / TOTAL_LAYERS
    return BASE_RADIUS + (LAST_RADIUS - BASE_RADIUS) * progress


def create_skirt_path() -> gc.Path:
    angles = np.linspace(0, 2 * np.pi, SKIRT_POINTS)
    radius = calculate_radius_at_layer(1) + WAVE_AMPLITUDE + SKIRT_OFFSET
    x = radius * np.cos(angles)
    y = radius * np.sin(angles)
    z = np.full_like(angles, LAYER_HEIGHT)
    return gc.Path(x, y, z)


def create_spiral_bottom() -> gc.Path:
    max_radius = calculate_radius_at_layer(1) + WAVE_AMPLITUDE
    num_turns = int(max_radius / INFILL_DISTANCE)
    total_points = num_turns * SPIRAL_POINTS_PER_TURN
    theta = np.linspace(0, 2 * np.pi * num_turns, total_points)
    r = np.linspace(0, max_radius, total_points)
    x = r * np.cos(theta)
    y = r * np.sin(theta)
    z = np.full_like(theta, LAYER_HEIGHT)
    return gc.Path(x, y, z)


def create_continuous_wave_wall() -> gc.Path:
    wall_layers = TOTAL_LAYERS - 1
    total_points = WALL_POINTS_PER_LAYER * wall_layers
    theta = np.linspace(0, 2 * np.pi * wall_layers, total_points)
    z = np.linspace(LAYER_HEIGHT, TOTAL_LAYERS * LAYER_HEIGHT, total_points)
    layer_progress = np.linspace(1, TOTAL_LAYERS, total_points)
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
