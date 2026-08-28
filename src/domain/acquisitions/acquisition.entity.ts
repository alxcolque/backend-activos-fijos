export interface AcquisitionDetailProps {
  id: string;
  acquisitionId: string;
  projectId?: string | null;
  unit?: string | null;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
  project?: {
    id: string;
    name: string;
  } | null;
}

export interface AcquisitionProps {
  id: string;
  userId: string;
  projectUserId?: string | null;
  checkoutUserId?: string | null;
  departureDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  user?: {
    id: string;
    fullName: string;
    email: string;
    profession?: string | null;
  } | null;

  projectUser?: {
    id: string;
    fullName: string;
    email: string;
    profession?: string | null;
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
  public readonly projectUserId: string | null;
  public readonly checkoutUserId: string | null;
  public readonly departureDate: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  public readonly user?: AcquisitionProps['user'];
  public readonly projectUser?: AcquisitionProps['projectUser'];
  public readonly checkoutUser?: AcquisitionProps['checkoutUser'];
  public readonly details?: AcquisitionDetailProps[];

  constructor(props: AcquisitionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.projectUserId = props.projectUserId ?? null;
    this.checkoutUserId = props.checkoutUserId ?? null;
    this.departureDate = props.departureDate ? new Date(props.departureDate) : null;
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();

    this.user = props.user;
    this.projectUser = props.projectUser;
    this.checkoutUser = props.checkoutUser;
    this.details = props.details;
  }
}
