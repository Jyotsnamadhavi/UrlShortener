import { DataSource } from "typeorm";
import { Url } from "../entities/Url";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    entities: [Url],
    synchronize: true,
    logging: false
}); 