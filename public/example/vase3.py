import numpy as np
import gcoordinator as gc

TOTAL_LAYERS = 100
LAYER_HEIGHT = 0.8
BASE_RADIUS = 35
LAST_RADIUS = 35
WAVE_AMPLITUDE = 1
WAVE_FREQUENCY = 60
LOW_FREQ_AMPLITUDE = 3
LOW_FREQ_FREQUENCY = 2
PHASE_INVERSION_LAYERS = 50
BOTTOM_LAYERS = 1
SPIRAL_POINTS_PER_TURN = 120
INFILL_DISTANCE = 1.5
WALL_POINTS_PER_LAYER = 720
SKIRT_OFFSET = 5
SKIRT_POINTS = 200


def calculate_radius_at_layer(layer: float) -> float:
    progress = layer / TOTAL_LAYERS
    return BASE_RADIUS + (LAST_RADIUS - BASE_RADIUS) * progress


def calculate_wall_start_radius() -> float:
    return calculate_radius_at_layer(BOTTOM_LAYERS)


def create_skirt_path() -> gc.Path:
    angles = np.linspace(0, 2 * np.pi, SKIRT_POINTS)
    radius = (
        calculate_wall_start_radius()
        + WAVE_AMPLITUDE
        + LOW_FREQ_AMPLITUDE
        + SKIRT_OFFSET
    )
    x = radius * np.cos(angles)
    y = radius * np.sin(angles)
    z = np.full_like(angles, LAYER_HEIGHT)
    return gc.Path(x, y, z)


def create_spiral_bottom() -> gc.Path:
    base_radius = calculate_wall_start_radius()
    num_turns = int(base_radius / INFILL_DISTANCE) + 1
    max_radius = num_turns * INFILL_DISTANCE
    total_points = num_turns * SPIRAL_POINTS_PER_TURN
    theta = np.linspace(0, 2 * np.pi * num_turns, total_points)
    r_base = np.linspace(0, max_radius, total_points)
    radius_progress = r_base / base_radius
    wave_strength = np.minimum(radius_progress, 1.0)
    angle_position = theta % (2 * np.pi)
    low_freq_angle = angle_position * LOW_FREQ_FREQUENCY
    low_freq_wave = LOW_FREQ_AMPLITUDE * np.sin(low_freq_angle) * wave_strength
    actual_radius = r_base + low_freq_wave
    x = actual_radius * np.cos(theta)
    y = actual_radius * np.sin(theta)
    z = np.full_like(theta, LAYER_HEIGHT)
    return gc.Path(x, y, z)


def create_continuous_wave_wall() -> gc.Path:
    wall_layers = TOTAL_LAYERS - BOTTOM_LAYERS
    total_points = WALL_POINTS_PER_LAYER * wall_layers
    theta = np.linspace(0, 2 * np.pi * wall_layers, total_points)
    z = np.linspace(
        BOTTOM_LAYERS * LAYER_HEIGHT, TOTAL_LAYERS * LAYER_HEIGHT, total_points
    )
    layer_progress = np.linspace(BOTTOM_LAYERS, TOTAL_LAYERS, total_points)
    expanding_radius = calculate_radius_at_layer(layer_progress)
    phase_cycle = (layer_progress - BOTTOM_LAYERS) / PHASE_INVERSION_LAYERS
    phase_offset = np.pi * np.sin(np.pi * phase_cycle) ** 2
    wave_angle = theta * WAVE_FREQUENCY + phase_offset
    high_freq_wave = WAVE_AMPLITUDE * np.cos(wave_angle)
    low_freq_angle = theta * LOW_FREQ_FREQUENCY + phase_offset
    low_freq_wave = LOW_FREQ_AMPLITUDE * np.sin(low_freq_angle)
    radius = expanding_radius + high_freq_wave + low_freq_wave
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
