function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateBike(body) {
  const { name, type } = body || {};
  const errors = [];

  if (!isNonEmptyString(name)) {
    errors.push('Bike name is required and must be a non-empty string');
  }
  if (!isNonEmptyString(type)) {
    errors.push('Bike type is required and must be a non-empty string');
  }

  return errors;
}

function validateRider(body) {
  const { name, email } = body || {};
  const errors = [];

  if (!isNonEmptyString(name)) {
    errors.push('Rider name is required and must be a non-empty string');
  }
  if (!isNonEmptyString(email)) {
    errors.push('Rider email is required and must be a non-empty string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Enter a valid email address');
  }

  return errors;
}

function validateRental(body) {
  const { rider_id, bike_id } = body || {};
  const errors = [];

  if (!Number.isInteger(Number(rider_id)) || Number(rider_id) <= 0) {
    errors.push('A valid rider_id is required');
  }
  if (!Number.isInteger(Number(bike_id)) || Number(bike_id) <= 0) {
    errors.push('A valid bike_id is required');
  }

  return errors;
}

module.exports = { validateBike, validateRider, validateRental };