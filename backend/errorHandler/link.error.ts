class LinkNotFoundError extends Error {
  constructor() {
    super('Link not found.');
    this.name = 'linkNotFoundError';
  }
}

class LinkExsistsError extends Error {
  constructor() {
    super('Link already exists.');
    this.name = 'LinkExsistsError';
  }
}

class LinkExpiredError extends Error {
  constructor() {
    super('Link has expired.');
    this.name = 'linkExpiredError';
  }
}

class LinkInactiveError extends Error {
  constructor() {
    super('Link is inactive.');
    this.name = 'linkInactiveError';
  }
}

class LinkCannotGenerateError extends Error {
  constructor() {
    super('Cannot generate a unique code after multiple attempts.');
    this.name = 'linkCannotGenerateError';
  }
}

class FailedToUpdateLinkError extends Error {
  constructor() {
    super('Failed to update the link.');
    this.name = 'failedToUpdateLinkError';
  }
}

class FailedToDeleteLinkError extends Error {
  constructor() {
    super('Failed to delete the link. Nothing was deleted.');
    this.name = 'failedToDeleteLinkError';
  }
}

class InvalidData extends Error {
  constructor() {
    super('Data is invalid');
    this.name = 'InvalidData';
  }
}

export {
  InvalidData,
  LinkNotFoundError,
  LinkExpiredError,
  LinkInactiveError,
  LinkExsistsError,
  LinkCannotGenerateError,
  FailedToUpdateLinkError,
  FailedToDeleteLinkError,
};
