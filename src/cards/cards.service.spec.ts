import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CardsService } from './cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';

describe('CardsService', () => {
  let service: CardsService;
  let prismaService: PrismaService;
  let s3Service: S3Service;

  const mockCard = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Card',
    description: 'Test Description',
    fileKey: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    card: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    prismaService = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new card', async () => {
      const createCardDto: CreateCardDto = {
        title: 'Test Card',
        description: 'Test Description',
      };

      mockPrismaService.card.create.mockResolvedValue(mockCard);

      const result = await service.create(createCardDto);

      expect(result).toEqual(mockCard);
      expect(prismaService.card.create).toHaveBeenCalledWith({
        data: createCardDto,
      });
      expect(prismaService.card.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of cards ordered by createdAt desc', async () => {
      const mockCards = [
        mockCard,
        { ...mockCard, id: 'another-id', createdAt: new Date('2025-01-02') },
      ];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await service.findAll();

      expect(result).toEqual(mockCards);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(prismaService.card.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no cards exist', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a card by id', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.findOne(mockCard.id);

      expect(result).toEqual(mockCard);
      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
    });

    it('should throw NotFoundException when card does not exist', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Card with ID non-existent-id not found',
      );
    });
  });

  describe('update', () => {
    it('should update a card with all fields', async () => {
      const updateCardDto: UpdateCardDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedCard = { ...mockCard, ...updateCardDto };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.card.update.mockResolvedValue(updatedCard);

      const result = await service.update(mockCard.id, updateCardDto);

      expect(result).toEqual(updatedCard);
      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
      expect(prismaService.card.update).toHaveBeenCalledWith({
        where: { id: mockCard.id },
        data: updateCardDto,
      });
    });

    it('should update a card with partial fields', async () => {
      const updateCardDto: UpdateCardDto = {
        title: 'Updated Title Only',
      };

      const updatedCard = { ...mockCard, ...updateCardDto };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.card.update.mockResolvedValue(updatedCard);

      const result = await service.update(mockCard.id, updateCardDto);

      expect(result).toEqual(updatedCard);
      expect(prismaService.card.update).toHaveBeenCalledWith({
        where: { id: mockCard.id },
        data: updateCardDto,
      });
    });

    it('should throw NotFoundException when updating non-existent card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a card without file', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.card.delete.mockResolvedValue(mockCard);

      await service.remove(mockCard.id);

      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
      expect(prismaService.card.delete).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
      expect(s3Service.deleteFile).not.toHaveBeenCalled();
    });

    it('should delete a card and its S3 file', async () => {
      const cardWithFile = { ...mockCard, fileKey: 'uploads/test.pdf' };

      mockPrismaService.card.findUnique.mockResolvedValue(cardWithFile);
      mockPrismaService.card.delete.mockResolvedValue(cardWithFile);
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      await service.remove(mockCard.id);

      expect(s3Service.deleteFile).toHaveBeenCalledWith('uploads/test.pdf');
      expect(prismaService.card.delete).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
    });

    it('should delete card even if S3 file deletion fails', async () => {
      const cardWithFile = { ...mockCard, fileKey: 'uploads/test.pdf' };

      mockPrismaService.card.findUnique.mockResolvedValue(cardWithFile);
      mockPrismaService.card.delete.mockResolvedValue(cardWithFile);
      mockS3Service.deleteFile.mockRejectedValue(new Error('S3 error'));

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      await service.remove(mockCard.id);

      expect(s3Service.deleteFile).toHaveBeenCalledWith('uploads/test.pdf');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting file from S3:',
        expect.any(Error),
      );
      expect(prismaService.card.delete).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should throw NotFoundException when deleting non-existent card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.card.delete).not.toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    const mockFile = {
      buffer: Buffer.from('test'),
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    it('should upload a file to a card without existing file', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockS3Service.uploadFile.mockResolvedValue(undefined);

      const cardWithFile = {
        ...mockCard,
        fileKey: expect.stringContaining('cards/'),
      };
      mockPrismaService.card.update.mockResolvedValue(cardWithFile);

      const result = await service.uploadFile(mockCard.id, mockFile);

      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: mockCard.id },
      });
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        mockFile,
        expect.stringMatching(/^cards\/.*\/.*-test\.pdf$/),
      );
      expect(prismaService.card.update).toHaveBeenCalledWith({
        where: { id: mockCard.id },
        data: { fileKey: expect.stringContaining('cards/') },
      });
    });

    it('should replace existing file when uploading new one', async () => {
      const cardWithFile = { ...mockCard, fileKey: 'uploads/old.pdf' };

      mockPrismaService.card.findUnique.mockResolvedValue(cardWithFile);
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockS3Service.uploadFile.mockResolvedValue(undefined);

      const updatedCard = {
        ...cardWithFile,
        fileKey: expect.stringContaining('cards/'),
      };
      mockPrismaService.card.update.mockResolvedValue(updatedCard);

      await service.uploadFile(mockCard.id, mockFile);

      expect(s3Service.deleteFile).toHaveBeenCalledWith('uploads/old.pdf');
      expect(s3Service.uploadFile).toHaveBeenCalled();
    });

    it('should upload new file even if old file deletion fails', async () => {
      const cardWithFile = { ...mockCard, fileKey: 'uploads/old.pdf' };

      mockPrismaService.card.findUnique.mockResolvedValue(cardWithFile);
      mockS3Service.deleteFile.mockRejectedValue(new Error('S3 error'));
      mockS3Service.uploadFile.mockResolvedValue(undefined);

      const updatedCard = {
        ...cardWithFile,
        fileKey: expect.stringContaining('cards/'),
      };
      mockPrismaService.card.update.mockResolvedValue(updatedCard);

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      await service.uploadFile(mockCard.id, mockFile);

      expect(s3Service.deleteFile).toHaveBeenCalledWith('uploads/old.pdf');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting old file from S3:',
        expect.any(Error),
      );
      expect(s3Service.uploadFile).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should throw NotFoundException when uploading to non-existent card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadFile('non-existent-id', mockFile),
      ).rejects.toThrow(NotFoundException);
      expect(s3Service.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('getFileUrl', () => {
    it('should return presigned URL for card with file', async () => {
      const cardWithFile = { ...mockCard, fileKey: 'uploads/test.pdf' };
      const mockUrl = 'https://s3.amazonaws.com/presigned-url';

      mockPrismaService.card.findUnique.mockResolvedValue(cardWithFile);
      mockS3Service.getPresignedUrl.mockResolvedValue(mockUrl);

      const result = await service.getFileUrl(mockCard.id);

      expect(result).toEqual({ url: mockUrl });
      expect(s3Service.getPresignedUrl).toHaveBeenCalledWith(
        'uploads/test.pdf',
      );
    });

    it('should throw NotFoundException when card has no file', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      await expect(service.getFileUrl(mockCard.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getFileUrl(mockCard.id)).rejects.toThrow(
        'Card does not have a file',
      );
      expect(s3Service.getPresignedUrl).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when card does not exist', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.getFileUrl('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
