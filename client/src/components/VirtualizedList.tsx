import { useRef, forwardRef, useImperativeHandle } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier } from 'dnd-core';
import type { Item } from '../api';

const ItemType = 'ROW';

interface VirtualizedListProps {
  items: Item[];
  total: number;
  loading: boolean;
  loadMoreItems: () => void;
  selectedIds: Set<number>;
  onSelectionChange: (itemId: number, isSelected: boolean) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: Item[];
    selectedIds: Set<number>;
    onSelectionChange: (itemId: number, isSelected: boolean) => void;
    moveItem: (dragIndex: number, hoverIndex: number) => void;
  };
}

const Row = ({ index, style, data }: RowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { items, selectedIds, onSelectionChange, moveItem } = data;
  const item = items[index];

  const [{ handlerId }, drop] = useDrop<Item, void, { handlerId: Identifier | null }>({
    accept: ItemType,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    // @ts-expect-error: react-dnd provides a monitor instance that we don't use
    hover(draggedItem: Item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = items.findIndex(i => i.id === draggedItem.id);
      const hoverIndex = index;

      if (dragIndex === -1 || dragIndex === hoverIndex) {
        return;
      }
      moveItem(dragIndex, hoverIndex);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  if (!item) {
    return <div style={style} className="loader-row">Загрузка...</div>;
  }
  const isSelected = selectedIds.has(item.id);

  return (
    <div ref={ref} className={`list-row ${isDragging ? 'dragging' : ''}`} style={style} data-handler-id={handlerId}>
      <input 
        type="checkbox" 
        checked={isSelected} 
        onChange={(e) => onSelectionChange(item.id, e.target.checked)}
      />
      <div className="list-row-content">{item.text}</div>
    </div>
  );
};

export const VirtualizedList = forwardRef(({ items, total, loading, loadMoreItems, selectedIds, onSelectionChange, moveItem }: VirtualizedListProps, ref) => {
  const listRef = useRef<List>(null);
  const currentItems = items || [];
  const itemCount = currentItems.length < total ? currentItems.length + 1 : currentItems.length;

  useImperativeHandle(ref, () => ({
    resetScroll: () => {
      listRef.current?.scrollToItem(0, 'start');
    }
  }));

  const loadMore = () => {
    if (!loading) {
      loadMoreItems();
    }
  };

  return (
    <List
      ref={listRef}
      height={600}
      itemCount={itemCount}
      itemSize={45}
      width="100%"
      itemData={{items: currentItems, selectedIds, onSelectionChange, moveItem}}
      onItemsRendered={({ visibleStopIndex }) => {
        if (visibleStopIndex >= currentItems.length - 5 && currentItems.length < total) {
          loadMore();
        }
      }}
    >
      {Row}
    </List>
  );
}); 