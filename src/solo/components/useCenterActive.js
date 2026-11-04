// 横にスクロールするタブ列で、選ばれているタブ（.on）を中央に寄せる（ページ自体はスクロールさせない）
import { useEffect, useRef } from "react";

export default function useCenterActive(dep) {
  const ref = useRef(null);
  useEffect(() => {
    const box = ref.current;
    const on = box?.querySelector(".on");
    if (!box || !on) return;
    box.scrollLeft = Math.max(0, on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2);
  }, [dep]);
  return ref;
}
