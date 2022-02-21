const { ROLE, hasRole } = require('../data/roles')
const { ADMIN, MANAGER, SELLER, CUSTOMER } = ROLE;

exports.canView = (user, item) => {
  return hasRole(user, [ADMIN, MANAGER, SELLER]);
}

exports.canList = (user) => {
  return hasRole(user, [ADMIN, MANAGER, SELLER]);
}

exports.scopedFilter = (user) => {
  if (user.roles.includes(ADMIN)) return {}
  if (user.roles.includes(MANAGER)) return {
    roles: {$nin: [ADMIN]}
  }
  if (user.roles.includes(SELLER)) {
    return {
      roles: CUSTOMER,
      seller: user.uid,
      // enabled: true,
    }
  }
  return {
    _id: user.uid
  }
}

exports.canPost = (user, item, {reqPage, req}) => {
  return (
     hasRole(user, ADMIN)
     || (
       hasRole(user, MANAGER)
       && !hasRole(req.body, ADMIN) // manager can't create admin account
     )
     || (
       hasRole(user, SELLER)
       && !hasRole(req.body, [ADMIN, MANAGER, SELLER]) // seller can't create admin account
     )
   );
}

exports.canPut = (user, item, {req} = {}) => {
  if (hasRole(user, ADMIN))
    return true;
  if (
    user.roles.includes(MANAGER)
    && !hasRole(item, ADMIN)
    && !hasRole(req.body, ADMIN)
  ) return true;
  const roles = [ADMIN, MANAGER, SELLER];
  if (
    user.roles.includes(SELLER)
    && !hasRole(item, roles)
    && !hasRole(req.body, roles)
  ) return true;
  return false;
}

exports.canDelete = (user, item, {flags, req} = {}) => {
  const { hasContent } = flags;
  const { itemHasContent } = item.flags;
  if (hasContent || itemHasContent) return false;
  if (user.roles.includes(ADMIN)) return true;
  if (
    user.roles.includes(MANAGER)
    && !hasRole(item, ADMIN)
  ) return true;
  const roles = [ADMIN, MANAGER, SELLER];
  if (
    user.roles.includes(SELLER)
    && !hasRole(item, roles)
    && (item.seller ? item.seller.toString() : undefined) === user.uid
  ) return true;
  return false;
}
