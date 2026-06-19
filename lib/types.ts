export type Item = {
  serial_number: string;
  name: string;
  category: string;
  color: string | null;
  image_url: string | null;
  listed_price: number;
  status: "in_stock" | "sold";
  price_sold: number | null;
  date_sold: string | null;
  date_added: string;
};

export type CategoryBreakdown = {
  category: string;
  count: number;
  revenue: number;
};

export type DailyRevenue = {
  date: string;
  revenue: number;
};
