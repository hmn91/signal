import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SortableItemProps<ID extends string | number> {
  id: ID
  children: React.ReactNode
  label?: string | undefined
}

const SortableItem = <ID extends string | number>(
  props: SortableItemProps<ID>,
) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
    cursor: "grab",
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.label !== undefined && (
        <span
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clipPath: "inset(50%)",
            whiteSpace: "nowrap",
          }}
        >
          {props.label}
        </span>
      )}
      {props.children}
    </div>
  )
}

export interface DraggableListProps<T, ID extends string | number> {
  items: T[]
  render: (item: T) => React.ReactNode
  getItemId: (item: T) => ID
  onItemMoved: (oldId: ID, newId: ID) => void
  enabled?: boolean
  getItemLabel?: (item: T) => string
}

export const DraggableList = <T extends object, ID extends string | number>({
  items: _items,
  render,
  getItemId,
  onItemMoved,
  enabled = true,
  getItemLabel,
}: DraggableListProps<T, ID>) => {
  const items = _items.map((item) => ({ id: getItemId(item), item }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Enable item click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  if (!enabled) {
    return (
      <>
        {items.map(({ id, item }) => (
          <div key={id}>{render(item)}</div>
        ))}
      </>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event

        if (over !== null && active.id !== over.id) {
          onItemMoved(active.id as ID, over.id as ID)
        }
      }}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem
            key={item.id}
            id={item.id}
            label={getItemLabel?.(item.item)}
          >
            {render(item.item)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}
