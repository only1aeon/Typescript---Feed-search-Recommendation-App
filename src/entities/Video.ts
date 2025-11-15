import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Segment } from "./Segment";

@Entity()
export class Video {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  title!: string;

  @Column("simple-array", { nullable: true })
  tags!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @Column("float", { default: 0.0 })
  duration!: number;

  @OneToMany(() => Segment, segment => segment.video)
  segments!: Segment[];
}
