import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Video } from "./Video";

@Entity()
export class Segment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Video, video => video.segments, { onDelete: "CASCADE" })
  video!: Video;

  @Column("float")
  start!: number;

  @Column("float")
  end!: number;

  @Column({ type: "text", nullable: true })
  transcript!: string;

  @Column({ type: "jsonb", nullable: true })
  asrLattice!: any;

  @Column("float", { nullable: true })
  asrConfidence!: number;
}
