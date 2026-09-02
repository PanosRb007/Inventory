import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddPurchase from './AddPurchase';

const locations = [{ id: 1, locationname: 'Graphics' }];
const materials = [{ matid: 'MAT1', name: 'Material One', extras: 0 }];
const vendors = [{ vendorid: 7, name: 'Vendor Seven' }];
const order = {
  location_id: 1,
  material_id: 'MAT1',
  quantity: '2',
  unitprice: '',
  vendor_id: '',
};

const jsonResponse = (body, ok = true) => ({
  ok,
  status: ok ? 200 : 404,
  json: async () => body,
});

const renderForm = (handleAdd = jest.fn().mockResolvedValue(true)) => render(
  <AddPurchase
    handleAdd={handleAdd}
    locations={locations}
    materials={materials}
    setMaterials={jest.fn()}
    vendors={vendors}
    setVendors={jest.fn()}
    apiBaseUrl="/api"
    order={order}
    userRole="Senior"
  />
);

beforeEach(() => {
  sessionStorage.setItem('authToken', 'test-token');
  global.fetch = jest.fn((url) => {
    if (url === '/api/materialchangesAPI/MAT1') {
      return Promise.resolve(jsonResponse({ price: '12.50', vendor: 7 }));
    }
    if (url === '/api/materiallist/MAT1') {
      return Promise.resolve(jsonResponse({ matid: 'MAT1', name: 'Material One', extras: 0 }));
    }
    if (url === '/api/materialchangesAPI/MAT1/1') {
      return Promise.resolve(jsonResponse({ error: 'API Route not found' }, false));
    }
    throw new Error(`Unexpected request: ${url}`);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  sessionStorage.clear();
});

test('uses the object returned by the global material-change endpoint to fill price and vendor', async () => {
  const { container } = renderForm();

  await waitFor(() => {
    expect(container.querySelector('input[name="price"]')).toHaveValue(12.5);
  });
  expect(screen.getByText('Vendor Seven')).toBeInTheDocument();
});

test('checks the implemented global material-change route when submitting', async () => {
  const handleAdd = jest.fn().mockResolvedValue(true);
  const { container } = renderForm(handleAdd);

  await waitFor(() => {
    expect(container.querySelector('input[name="price"]')).toHaveValue(12.5);
  });
  const callsBeforeSubmit = global.fetch.mock.calls.length;
  fireEvent.submit(container.querySelector('form'));

  await waitFor(() => expect(handleAdd).toHaveBeenCalledTimes(1));
  const submitUrls = global.fetch.mock.calls
    .slice(callsBeforeSubmit)
    .map(([url]) => url);
  expect(submitUrls).toContain('/api/materialchangesAPI/MAT1');
  expect(submitUrls).not.toContain('/api/materialchangesAPI/MAT1/1');
});

test('keeps the entered form values when adding the purchase fails', async () => {
  const handleAdd = jest.fn().mockResolvedValue(false);
  const { container } = renderForm(handleAdd);

  await waitFor(() => {
    expect(container.querySelector('input[name="price"]')).toHaveValue(12.5);
  });
  const quantityInput = container.querySelector('input[name="quantity"]');
  fireEvent.change(quantityInput, { target: { value: '3' } });
  fireEvent.submit(container.querySelector('form'));

  await waitFor(() => expect(handleAdd).toHaveBeenCalledTimes(1));
  expect(quantityInput).toHaveValue(3);
});
