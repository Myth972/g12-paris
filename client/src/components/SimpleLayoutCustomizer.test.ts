import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleLayoutCustomizer } from '../client/src/components/SimpleLayoutCustomizer';

describe('SimpleLayoutCustomizer', () => {
  it('should render all 4 steps', () => {
    const mockOnSave = vi.fn();
    
    render(
      <SimpleLayoutCustomizer 
        onSave={mockOnSave}
      />
    );
    
    expect(screen.getByText(/Nom de votre layout/i)).toBeInTheDocument();
    expect(screen.getByText(/Choisir un template/i)).toBeInTheDocument();
    expect(screen.getByText(/Personnaliser les options/i)).toBeInTheDocument();
    expect(screen.getByText(/Résumé de votre layout/i)).toBeInTheDocument();
  });

  it('should update layout name', () => {
    const mockOnSave = vi.fn();
    
    render(
      <SimpleLayoutCustomizer 
        onSave={mockOnSave}
      />
    );
    
    const input = screen.getByPlaceholderText(/Ex: Mon layout personnel/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test Layout' } });
    
    expect(input.value).toBe('Test Layout');
  });

  it('should select template', () => {
    const mockOnSave = vi.fn();
    
    render(
      <SimpleLayoutCustomizer 
        onSave={mockOnSave}
      />
    );
    
    const listOption = screen.getByText(/Liste/i).closest('button');
    fireEvent.click(listOption!);
    
    expect(screen.getByText(/Sélectionné/i)).toBeInTheDocument();
  });

  it('should call onSave with correct data', () => {
    const mockOnSave = vi.fn();
    
    render(
      <SimpleLayoutCustomizer 
        onSave={mockOnSave}
      />
    );
    
    // Set layout name
    const input = screen.getByPlaceholderText(/Ex: Mon layout personnel/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Test Layout' } });
    
    // Click save button
    const saveButton = screen.getByText(/Créer mon layout/i);
    fireEvent.click(saveButton);
    
    expect(mockOnSave).toHaveBeenCalledWith(
      'My Test Layout',
      'grid',
      expect.objectContaining({
        displayMode: 'cards',
        columns: 3,
        articlesPerPage: 12,
      })
    );
  });
});
