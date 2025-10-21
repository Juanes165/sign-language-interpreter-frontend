export default function getVideoConstraints() {
  const width = window.innerWidth;

  // // sm and less 3:4 mobile
  // if (width < 768) {
  //   return { width: 720, height: 960 };
  // // md 4:3 tablet
  // } else if (width < 1024) {
  //   return { width: 960, height: 720 };
  // // lg 16:9 pc
  // } else {
  //   return { width: 1280, height: 720 };
  // }
  if(width >= 1280) {
    return { width: 1280, height: 720 };
  }
  return {}
};
