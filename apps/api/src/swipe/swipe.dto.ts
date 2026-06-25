import { IsUUID } from 'class-validator';

export class CreateSwipeDto {
  @IsUUID()
  postId!: string;
}
