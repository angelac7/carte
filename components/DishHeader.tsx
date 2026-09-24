type DishHeaderProps = {
  name: string;
  price: string;
  as?: "h2" | "h3" | "span";
};

/** Dish name and price joined by a dotted leader line, like a printed menu. */
export function DishHeader({ name, price, as: Name = "span" }: DishHeaderProps) {
  return (
    <div className="flex items-baseline">
      <Name className="font-serif text-xl">{name}</Name>
      <span className="leader" aria-hidden="true" />
      <span className="tabular-nums">{price}</span>
    </div>
  );
}
