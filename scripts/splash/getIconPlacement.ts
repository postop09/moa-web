type Canvas = {
  width: number;
  height: number;
};

// iOS 런치 스크린 관례상 짧은 변의 30%. 50%는 특히 iPad에서 로고가 과대해 보인다.
const ICON_SCALE = 0.3;
// 원본이 icon-512.png라 512px을 넘겨 확대하면 흐려진다.
const MAX_ICON_SIZE = 512;

export const getIconPlacement = ({ width, height }: Canvas) => {
  const size = Math.min(
    Math.round(Math.min(width, height) * ICON_SCALE),
    MAX_ICON_SIZE,
  );

  return {
    size,
    left: Math.round((width - size) / 2),
    top: Math.round((height - size) / 2),
  };
};
