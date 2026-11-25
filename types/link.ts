export type Link = {
  code: string;
  originalUrl: string;
  active: boolean;
  clicks: number;
  createdAt: string;
  // ISO date; null hoặc không có = không bao giờ hết hạn
  expirationDate?: string | null;
};

// Cấu trúc của file data/links.json
export type LinksFile = {
  data: Link[];
};

export type CreateLinkInput = {
  originalUrl: string;
  customCode?: string;
  expirationDate?: string | null;
};

export type UpdateLinkInput = Partial<Pick<Link, 'originalUrl' | 'active' | 'expirationDate'>>;

// Một dòng trong logs/clicks.log
export type ClickLogEntry = {
  time: string;
  code: string;
  userAgent: string;
};
