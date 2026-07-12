import { StaticVenueRepository } from '../infrastructure/venueRepository';

describe('StaticVenueRepository', () => {
  it('should return null for non-existent venue', async () => {
    const repo = new StaticVenueRepository();
    const result = await repo.getVenueById('unknown');
    expect(result).toBeNull();
  });

  it('should return a valid layout for metlife', async () => {
    const repo = new StaticVenueRepository();
    const result = await repo.getVenueById('metlife');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('metlife');
    expect(result?.entrances.length).toBeGreaterThan(0);
  });
});
