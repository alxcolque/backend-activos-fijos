export interface AcquisitionDetailProps {
  id: string;
  acquisitionId: string;
  supplyId?: string | null;
  assetId?: string | null;
  unit?: string | null;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
  supply?: {
    id: string;
    name: string;
    unit: string;
  } | null;
  asset?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface AcquisitionProps {
  id: string;
  userId: string;
  projectId?: string | null;
  checkoutUserId?: string | null;
  departureDate?: Date | null;
  type?: 'SUPPLY' | 'ASSET' | string;
  createdAt?: Date;
  updatedAt?: Date;

  user?: {
    id: string;
    fullName: string;
    email: string;
    profession?: string | null;
  } | null;

  project?: {
    id: string;
    name: string;
  } | null;

  checkoutUser?: {
    id: string;
    fullName: string;
    email: string;
    profession?: string | null;
  } | null;

  details?: AcquisitionDetailProps[];
}

export class AcquisitionEntity {
  public readonly id: string;
  public readonly userId: string;
  public readonly projectId: string | null;
  public readonly checkoutUserId: string | null;
  public readonly departureDate: Date | null;
  public readonly type: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public readonly user?: AcquisitionProps['user'];
  public readonly project?: AcquisitionProps['project'];
  public readonly checkoutUser?: AcquisitionProps['checkoutUser'];
  public readonly details?: AcquisitionDetailProps[];

  constructor(props: AcquisitionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.projectId = props.projectId ?? null;
    this.checkoutUserId = props.checkoutUserId ?? null;
    this.departureDate = props.departureDate ? new Date(props.departureDate) : null;
    this.type = props.type || 'SUPPLY';
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();

    this.user = props.user;
    this.project = props.project;
    this.checkoutUser = props.checkoutUser;
    this.details = props.details;
  }
}
