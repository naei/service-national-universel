const initialState = {
  tickets: null,
  new: 0,
  open: 0,
  closed: 0,
  tags: null,
};

const reducer = (oldState = initialState, action) => {
  switch (action.type) {
    case 'FETCH_TICKETS':
      return {
        ...oldState,
        tickets: action.payload.tickets,
        new: action.payload.new,
        open: action.payload.open,
        closed: action.payload.closed,
      };
    case 'DISPATCH_TAGS':
      return {
        ...oldState,
        tags: action.payload.tags,
      };
    default:
      return { ...oldState };
  }
};

export default reducer;
