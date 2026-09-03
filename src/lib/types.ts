export interface ItemDTO {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  position: number;
}

export interface EditListDTO {
  id: string;
  title: string;
  eventDate: string | null;
  description: string | null;
  editToken: string;
  viewToken: string;
  createdAt: string;
  items: ItemDTO[];
}
