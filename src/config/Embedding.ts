import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
@Index(["ownerType", "ownerId"])
export class Embedding {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  ownerType!: "video" | "user";

  @Column()
  ownerId!: number;

  @Column("bytea")
  vector!: Buffer;

  @Column()
  dim!: number;
}
