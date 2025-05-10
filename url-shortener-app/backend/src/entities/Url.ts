import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    Index
} from "typeorm";

@Entity("urls")
export class Url {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    shortUrl!: string;

    @Column()
    longUrl!: string;

    @Index()
    @Column({ unique: true })
    slug!: string;

    @Column({ default: 0 })
    visits!: number;

    @Column({ nullable: true })
    userId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 