import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';

type Card = {
  id: string;
  title: string;
  description: string;
  fileKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CardsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async create(createCardDto: CreateCardDto): Promise<Card> {
    return this.prisma.card.create({
      data: createCardDto,
    });
  }

  async findAll(): Promise<Card[]> {
    return this.prisma.card.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Card> {
    const card = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto): Promise<Card> {
    await this.findOne(id);

    return this.prisma.card.update({
      where: { id },
      data: updateCardDto,
    });
  }

  async remove(id: string): Promise<void> {
    const card = await this.findOne(id);

    if (card.fileKey) {
      try {
        await this.s3Service.deleteFile(card.fileKey);
      } catch (error) {
        console.error('Error deleting file from S3:', error);
      }
    }

    await this.prisma.card.delete({
      where: { id },
    });
  }

  async uploadFile(id: string, file: Express.Multer.File): Promise<Card> {
    const card = await this.findOne(id);

    if (card.fileKey) {
      try {
        await this.s3Service.deleteFile(card.fileKey);
      } catch (error) {
        console.error('Error deleting old file from S3:', error);
      }
    }

    const fileKey = `cards/${id}/${Date.now()}-${file.originalname}`;
    await this.s3Service.uploadFile(file, fileKey);

    return this.prisma.card.update({
      where: { id },
      data: { fileKey },
    });
  }

  async getFileUrl(id: string): Promise<{ url: string }> {
    const card = await this.findOne(id);

    if (!card.fileKey) {
      throw new NotFoundException('Card does not have a file');
    }

    const url = await this.s3Service.getPresignedUrl(card.fileKey);
    return { url };
  }
}
