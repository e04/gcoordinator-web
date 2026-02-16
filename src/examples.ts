export const EXAMPLE_PATHS = {
  rectangle_wall: "/gcoordinator-web/example/rectangle_wall.py",
  cylinder_wall: "/gcoordinator-web/example/cylinder_wall.py",
  cylinder: "/gcoordinator-web/example/cylinder.py",
  dish: "/gcoordinator-web/example/dish.py",
  box: "/gcoordinator-web/example/box.py",
  vase1: "/gcoordinator-web/example/vase1.py",
  vase2: "/gcoordinator-web/example/vase2.py",
  vase3: "/gcoordinator-web/example/vase3.py",
  vase4: "/gcoordinator-web/example/vase4.py",
  wave_wall: "/gcoordinator-web/example/wave_wall.py",
  sphere_wall: "/gcoordinator-web/example/sphere_wall.py",
} as const;

export type ExampleKey = keyof typeof EXAMPLE_PATHS;

export const EXAMPLE_OPTIONS: ExampleKey[] = [
  "rectangle_wall",
  "cylinder_wall",
  "cylinder",
  "dish",
  "box",
  "vase1",
  "vase2",
  "vase3",
  "vase4",
  "wave_wall",
  "sphere_wall",
];

export const DEFAULT_EXAMPLE: ExampleKey = "vase2";

export async function loadExampleCode(example: ExampleKey): Promise<string> {
  const response = await fetch(EXAMPLE_PATHS[example]);
  if (!response.ok) {
    throw new Error(`Failed to load example "${example}"`);
  }
  return response.text();
}
