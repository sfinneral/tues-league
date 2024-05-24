import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { Flex, IconButton } from "@radix-ui/themes";
import { ReactNode, useEffect, useRef, useState } from "react";

interface CarouselProps {
  children: ReactNode;
  startIndex?: number;
}

export default function Carousel({ children, startIndex = 0 }: CarouselProps) {
  const allItemsRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const defaultHeight = 500;
  const [height, setHeight] = useState(defaultHeight);
  const [left, setLeft] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [hasWidthBeenSet, setHasWidthBeenSet] = useState(false);

  const getHeight = () => {
    if (!allItemsRef?.current) return defaultHeight;
    let height = 0;
    for (const item of allItemsRef.current.children) {
      height = item.clientHeight > height ? item.clientHeight : height;
    }
    return height;
  };

  const setChildWidth = () => {
    if (allItemsRef.current && wrapperRef.current) {
      for (const item of allItemsRef.current.children) {
        (
          item as HTMLElement
        ).style.width = `${wrapperRef.current.clientWidth}px`;
      }
    }
  };

  useEffect(() => {
    const init = () => {
      if (wrapperRef.current?.clientWidth && !hasWidthBeenSet) {
        setChildWidth();
        setHasWidthBeenSet(true);
        setHeight(getHeight());
        setLeft(currentIndex * wrapperRef.current.clientWidth * -1);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (wrapperRef.current) {
      setLeft(currentIndex * wrapperRef.current.clientWidth * -1);
    }
  }, [currentIndex]);

  return (
    <div
      className={`transition-opacity ${
        hasWidthBeenSet ? "opacity-100" : "opacity-0"
      }`}
    >
      <Flex justify="between" align="center" mb="3">
        {currentIndex > 0 ? (
          <IconButton
            variant="soft"
            onClick={() => setCurrentIndex(currentIndex - 1)}
          >
            <ArrowLeftIcon />
          </IconButton>
        ) : (
          <div />
        )}

        {allItemsRef.current &&
        currentIndex < allItemsRef.current.children.length - 1 ? (
          <IconButton
            variant="soft"
            onClick={() => setCurrentIndex(currentIndex + 1)}
          >
            <ArrowRightIcon />
          </IconButton>
        ) : (
          <div />
        )}
      </Flex>
      <div
        ref={wrapperRef}
        className="relative overflow-hidden w-full"
        style={{ height }}
      >
        <div
          ref={allItemsRef}
          className="transition-all absolute top-0 flex"
          style={{ left }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
