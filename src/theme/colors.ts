export const light = {
  background: '#f2f7fa', surface: '#ffffff', brand: '#064e3b', brandStrong: '#043d31',
  brandSoft: '#e7f6f1', ink: '#0c1828', muted: '#637083', line: '#d9e1e8',
  danger: '#b42318', warning: '#9a6700', success: '#14804a',
};
export type Colors = typeof light;
export function useColors(): Colors {
  return light;
}
