const names = [['map-outline', 'map'], ['calendar-outline', 'calendar'], ['home-outline', 'home'], ['bag-handle-outline', 'bag-handle'], ['person-outline', 'person']] as const;
export type TabIconName = typeof names[number][number];
type Image = { uri: string; width: number; height: number; scale: number };

export async function loadTabIconImages(load: (name: TabIconName, size: number) => Promise<Image | null>) {
  return Promise.all(names.map(async ([normal, selected]) => {
    const [defaultImage, selectedImage] = await Promise.all([load(normal, 21), load(selected, 21)]);
    if (!defaultImage || !selectedImage) throw new Error('Tab icons are not ready');
    return { default: defaultImage, selected: selectedImage };
  }));
}
