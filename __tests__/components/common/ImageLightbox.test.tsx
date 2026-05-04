import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageLightbox from '@/components/common/ImageLightbox';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={(props.alt as string) ?? ''} />
  ),
}));

const mockImages = [
  { id: 'img-1', url: 'https://example.com/1.jpg' },
  { id: 'img-2', url: 'https://example.com/2.jpg' },
  { id: 'img-3', url: 'https://example.com/3.jpg' },
];

describe('ImageLightbox', () => {
  // ── Thumbnail rendering ──

  it('should render thumbnail buttons for each image', () => {
    render(<ImageLightbox images={mockImages} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('should render nothing when images array is empty', () => {
    const { container } = render(<ImageLightbox images={[]} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('should render thumbnails with correct src', () => {
    const { container } = render(<ImageLightbox images={mockImages} />);
    const imgs = container.querySelectorAll('img');
    expect(imgs[0]).toHaveAttribute('src', 'https://example.com/1.jpg');
    expect(imgs[2]).toHaveAttribute('src', 'https://example.com/3.jpg');
  });

  // ── Open lightbox ──

  it('should open lightbox when clicking a thumbnail', () => {
    render(<ImageLightbox images={mockImages} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    // Lightbox should show counter and close button
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should show the clicked image in lightbox', () => {
    render(<ImageLightbox images={mockImages} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Click second image

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  // ── Close lightbox ──

  it('should close lightbox when pressing Escape', () => {
    render(<ImageLightbox images={mockImages} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('1 / 3')).not.toBeInTheDocument();
  });

  it('should close lightbox when clicking close button', () => {
    render(<ImageLightbox images={mockImages} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Close button is in the portal — find by SVG inside a button in the lightbox
    const allButtons = screen.getAllByRole('button');
    // Close button is the one that appeared after opening (not a thumbnail)
    const closeBtn = allButtons.find(
      (btn) => btn.closest('.fixed') && btn.querySelector('svg path[d*="18 6"]')
    );
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn!);

    expect(screen.queryByText('1 / 3')).not.toBeInTheDocument();
  });

  // ── Navigation ──

  it('should navigate to next image with right arrow key', () => {
    render(<ImageLightbox images={mockImages} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous image with left arrow key', () => {
    render(<ImageLightbox images={mockImages} />);
    // Open on last image
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should not go below index 0 with left arrow', () => {
    render(<ImageLightbox images={mockImages} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument(); // stays at 1
  });

  it('should not go beyond last index with right arrow', () => {
    render(<ImageLightbox images={mockImages} />);
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('3 / 3')).toBeInTheDocument(); // stays at 3
  });

  it('should navigate with next/prev buttons', () => {
    render(<ImageLightbox images={mockImages} />);
    fireEvent.click(screen.getAllByRole('button')[0]);

    // Find next button (has ArrowRight-like SVG path "M9 5l7 7-7 7")
    const allButtons = screen.getAllByRole('button');
    const nextBtn = allButtons.find(
      (btn) => btn.closest('.fixed') && btn.querySelector('svg path[d*="9 5"]')
    );
    expect(nextBtn).toBeTruthy();
    fireEvent.click(nextBtn!);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  // ── Single image ──

  it('should not show counter for single image', () => {
    render(<ImageLightbox images={[mockImages[0]]} />);
    fireEvent.click(screen.getAllByRole('button')[0]);

    // Should not have "1 / 1" counter
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  });

  it('should not show nav buttons for single image', () => {
    render(<ImageLightbox images={[mockImages[0]]} />);
    fireEvent.click(screen.getAllByRole('button')[0]);

    // Only close button in the lightbox, no prev/next
    const lightboxButtons = screen.getAllByRole('button').filter(
      (btn) => btn.closest('.fixed')
    );
    expect(lightboxButtons).toHaveLength(1); // only close button
  });

  // ── Body scroll lock ──

  it('should lock body scroll when open and unlock when closed', () => {
    render(<ImageLightbox images={mockImages} />);
    expect(document.body.style.overflow).toBe('');

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).toBe('');
  });
});
