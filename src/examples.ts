export const EXAMPLE_PATHS = {
  rectangle_wall: "/example/rectangle_wall.py",
  cylinder_wall: "/example/cylinder_wall.py",
  cylinder: "/example/cylinder.py",
  dish: "/example/dish.py",
  box: "/example/box.py",
  vase1: "/example/vase1.py",
  vase2: "/example/vase2.py",
  vase3: "/example/vase3.py",
  vase4: "/example/vase4.py",
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
];

export const DEFAULT_EXAMPLE: ExampleKey = "rectangle_wall";

export async function loadExampleCode(example: ExampleKey): Promise<string> {
  const response = await fetch(EXAMPLE_PATHS[example]);
  if (!response.ok) {
    throw new Error(`Failed to load example "${example}"`);
  }
  return response.text();
}
