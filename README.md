# gcoordinator-web

A browser-based G-code generation tool for 3D printing, powered by gcoordinator.

**Live demo:** https://e04.github.io/gcoordinator-web/

<img width="1508" height="1009" alt="gcoordinator-web screenshot" src="https://github.com/user-attachments/assets/104ffffb-80d4-4795-afcf-7896265df852" />

## What is gcoordinator-web?

gcoordinator-web is an online editor and 3D preview tool for generating G-code using Python code — directly in your browser, with no installation required.

Write Python scripts that define 3D printing toolpaths using the [gcoordinator](https://github.com/tomohiron907/gcoordinator) library, and instantly see both the generated G-code and a real-time 3D visualization. When you're satisfied, download the G-code file ready for your printer.

### Key Features

- **In-browser Python execution** — Runs Python via [Pyodide](https://pyodide.org/) (WebAssembly), so nothing needs to be installed locally.
- **Real-time preview** — Code is automatically re-executed on changes, and the 3D toolpath visualization updates live.
- **Monaco-based code editor** — Syntax highlighting, autocompletion, and a familiar editing experience (the same editor that powers VS Code).
- **G-code download** — Export generated G-code directly from the browser.

## Relationship to gcoordinator

[gcoordinator](https://github.com/tomohiron907/gcoordinator) is a Python library created by **tomohiron907** for generating G-code for 3D printing through code.

**gcoordinator-web** is a browser-based frontend that brings the gcoordinator workflow to the web. Under the hood, it uses [gcoordinator-lite](https://github.com/e04/gcoordinator-lite) — a lightweight fork optimized for running in the browser via Pyodide.

## Usage

### Basic Workflow

1. **Open the app** at https://e04.github.io/gcoordinator-web/
2. **Write or edit Python code** in the left-hand editor panel.
3. **View the results** — the 3D visualization and G-code text update automatically.
4. **Download the G-code** by clicking the download button in the toolbar when you're ready.

### Writing Scripts

Import `gcoordinator` and `numpy`, then build your toolpaths by creating `gc.Path` objects and appending them to the global `full_object` list.

**Important:** You do **not** need to call `gc.gui_export(full_object)`. The runtime automatically reads the global variable `full_object` after your script finishes and generates G-code from it. Simply define `full_object` as a list and append your paths to it.

#### Minimal Example

```python
import numpy as np
import gcoordinator as gc

full_object = []

for height in range(100):
    arg = np.linspace(0, 2 * np.pi, 100)
    x = 10 * np.cos(arg)
    y = 10 * np.sin(arg)
    z = np.full_like(arg, (height + 1) * 0.2)
    wall = gc.Path(x, y, z)
    full_object.append(wall)
```

This creates a simple cylinder wall — 100 circular layers, each 0.2 mm apart.

#### How It Works

1. Define `full_object` as an empty list: `full_object = []`
2. Create `gc.Path(x, y, z)` objects, where `x`, `y`, and `z` are NumPy arrays describing the toolpath coordinates.
3. Append each path to `full_object`.
4. The runtime automatically detects `full_object` and generates G-code via `gc.GCode(full_object).generate()`.

#### Configuring Print Settings

You can customize printer settings using `gc.set_settings()`:

```python
import gcoordinator as gc

settings = {
    "Print": {
        "nozzle": {"nozzle_diameter": 0.8, "filament_diameter": 1.75},
        "layer": {"layer_height": 0.5},
        "speed": {"print_speed": 1000, "travel_speed": 5000},
        "origin": {"x": 90, "y": 90},
        "fan_speed": {"fan_speed": 128},
        "temperature": {"nozzle_temperature": 220, "bed_temperature": 50},
        "travel_option": {
            "retraction": False,
            "retraction_distance": 2.0,
            "unretraction_distance": 2.0,
            "z_hop": False,
            "z_hop_distance": 3,
        },
        "extrusion_option": {"extrusion_multiplier": 1.0},
    },
    "Hardware": {
        "kinematics": "Cartesian",
        "bed_size": {"bed_size_x": 180, "bed_size_y": 180, "bed_size_z": 180},
    },
}

gc.set_settings(settings)

full_object = []

for height in range(100):
    ...
```
