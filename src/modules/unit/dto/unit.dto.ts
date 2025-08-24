import {PostingDto} from "@/modules/posting/dto/posting.dto";

export interface UnitDto extends PostingDto {
    lastOperationDate: Date | null,
    status: string
    costPrice: number,
    margin: number,
    totalServices: number,
    services: {
        name: string,
        price: number,
    }[],
}