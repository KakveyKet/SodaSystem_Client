export default {
  language: {
    english: "English",
    khmer: "Khmer",
    selectLanguage: "Language",
  },

  common: {
    add: "Add",
    create: "Create",
    edit: "Edit",
    update: "Update",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    reset: "Reset",
    print: "Print",
    view: "View",
    actions: "Actions",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    loading: "Loading...",
    noData: "No data found",
    yes: "Yes",
    no: "No",
    name: "Name",
    description: "Description",
    date: "Date",
    fromDate: "From Date",
    toDate: "To Date",
    dateRange: "Date Range",
    total: "Total",
    previous: "Previous",
    next: "Next",
  },

  nav: {
    dashboard: "Dashboard",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    register: "Register",
  },

  dashboard: {
    title: "Dashboard",
    subtitle: "Management System",

    invoiceList: "Invoice List",
    customerList: "Customer List",
    productList: "Product List",
    categoryList: "Category List",
    rateList: "Rate List",
    userList: "User List",

    invoiceDescription: "Manage invoices",
    customerDescription: "Manage customers",
    productDescription: "Manage products",
    categoryDescription: "Manage categories",
    rateDescription: "Manage rates",
    userDescription: "Manage system users",
  },

  auth: {
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    login: "Login",
    logout: "Logout",
    loggingIn: "Logging in...",
    welcomeBack: "Welcome back",
    loginTitle: "Sign in to your account",
    invalidCredentials: "Invalid email or password",
  },

  invoice: {
    title: "Invoice",
    invoiceList: "Invoice List",
    createInvoice: "Create Invoice",
    editInvoice: "Edit Invoice",
    invoiceDetail: "Invoice Detail",
    invoiceName: "Invoice Name",
    invoiceDate: "Invoice Date",
    customer: "Customer",
    category: "Category",
    product: "Product",

    twoDigitRate: "2D Rate",
    threeDigitRate: "3D Rate",

    rowName: "Row Name",
    twoDigit: "2D",
    threeDigit: "3D",
    correctTwo: "Correct 2D",
    correctThree: "Correct 3D",

    addRow: "Add Row",
    duplicateRow: "Duplicate Row",
    removeRow: "Remove Row",

    searchPlaceholder: "Search invoice...",
    selectCustomer: "Select customer",
    selectCategory: "Select category",
    selectProduct: "Select product",
    selectDateRange: "Select date range",

    created: "Invoice created successfully",
    updated: "Invoice updated successfully",
    deleted: "Invoice deleted successfully",

    deleteTitle: "Delete Invoice",
    deleteConfirm:
      "Are you sure you want to delete this invoice?",

    noInvoices: "No invoices found",
  },

  customer: {
    title: "Customer Management",
    add: "Add Customer",
    edit: "Edit",
    delete: "Delete",
    create: "Create",
    update: "Update",
    cancel: "Cancel",
    search: "Search",
    reset: "Reset",

    searchPlaceholder:
      "Search by username, email, branch, phone, or address",

    allStatuses: "All statuses",
    noCustomers: "No customers found",
    noEmail: "No email",

    pageOf: "Page {page} of {total}",

    status: {
      active: "Active",
      inactive: "Inactive",
    },

    role: {
      customer: "Customer",
    },

    login: {
      title: "Customer login account",

      description:
        "Creates a linked User account with the customer role.",

      ready: "Ready",
      missing: "Missing",

      readyLong: "Login ready",
      missingLong: "No login account",

      emailOptional: "Optional",

      createPasswordPlaceholder:
        "Minimum 6 characters",

      updatePasswordPlaceholder:
        "Enter a new password",

      confirmPasswordPlaceholder:
        "Enter password again",

      createPasswordHelp:
        "Password is required when creating a customer.",

      legacyPasswordHelp:
        "This customer does not have a login account. Enter a password to create one.",

      existingPasswordHelp:
        "Leave both password fields empty to keep the current password.",
    },

    sections: {
      customerInformation:
        "Customer information",
    },

    fields: {
      username: "Username",
      email: "Email",
      role: "Role",
      login: "Login account",
      branch: "Branch",
      phone: "Phone number",
      balance: "Balance",
      status: "Status",
      address: "Address",
      description: "Description",
      password: "Password",
      confirmPassword: "Confirm password",
    },

    placeholders: {
      username: "Enter customer username",
      email: "customer@example.com",
      branch: "Enter branch",
      phone: "Enter phone number",
      address: "Enter customer address",
      description: "Enter customer description",
    },

    columns: {
      username: "Username",
      email: "Email",
      role: "Role",
      login: "Login",
      branch: "Branch",
      phone: "Phone number",
      balance: "Balance",
      status: "Status",
      action: "Actions",
    },

    dialogs: {
      addTitle: "Create Customer",
      editTitle: "Edit Customer",
      deleteTitle: "Delete Customer",
    },

    deleteQuestion:
      'Are you sure you want to delete customer "{name}"?',

    deleteLoginNote:
      "Deleting this customer also deletes the linked customer login account.",

    messages: {
      created:
        "Customer and login account created successfully.",

      updated:
        "Customer and login account updated successfully.",

      deleted:
        "Customer and linked login account deleted successfully.",
    },

    errors: {
      fetch:
        "Could not fetch customers.",

      save:
        "Could not save customer.",

      delete:
        "Could not delete customer.",

      idMissing:
        "Customer ID was not found.",

      usernameRequired:
        "Username is required.",

      usernameTooLong:
        "Username cannot exceed 100 characters.",

      invalidEmail:
        "Please enter a valid email address.",

      branchRequired:
        "Branch is required.",

      passwordRequired:
        "Password is required to create customer login access.",

      passwordTooShort:
        "Password must contain at least 6 characters.",

      passwordMismatch:
        "Password and confirm password do not match.",

      invalidBalance:
        "Balance must be a valid number.",

      balanceNegative:
        "Balance cannot be negative.",
    },
  },

product: {
  title: "Products",

  add: "Add",
  search: "Search",
  reset: "Reset",
  edit: "Edit",
  delete: "Delete",
  cancel: "Cancel",
  create: "Create",
  update: "Update",

  searchPlaceholder: "Search product...",
  allCategories: "All categories",
  allStatuses: "All statuses",
  noProducts: "No products found.",
  pageOf: "Page {page} of {total}",

  status: {
    active: "Active",
    inactive: "Inactive",
  },

  columns: {
    product: "Product",
    category: "Category",
    multiplier: "Multiplier",
    description: "Description",
    status: "Status",
    action: "Action",
  },

  dialogs: {
    addTitle: "Add Product",
    editTitle: "Edit Product",
    deleteTitle: "Delete Product",
  },

  fields: {
    category: "Category",
    name: "Product Name",
    multiplier: "Win Multiplier",
    description: "Description",
    status: "Status",
  },

  placeholders: {
    category: "Select category",
    name: "Enter product name",
    description: "Enter product description",
  },

  deleteQuestion: "Delete {name}?",
  deleteWarning:
    "A product assigned to an invoice cannot be deleted.",

  messages: {
    created: "Product created successfully",
    updated: "Product updated successfully",
    deleted: "Product deleted successfully",
  },

  errors: {
    fetch: "Could not fetch products",
    save: "Could not save product",
    delete: "Could not delete product",
    load: "Could not load product page",
    idMissing: "Product ID was not found",
    categoryRequired: "Category is required",
    nameRequired: "Product name is required",
    multiplierRequired: "Win multiplier is required",
    multiplierNegative:
      "Win multiplier cannot be negative",
  },
},

rate: {
  title: "Rates",

  add: "Add",
  search: "Search",
  reset: "Reset",
  edit: "Edit",
  delete: "Delete",
  cancel: "Cancel",
  create: "Create",
  update: "Update",

  searchPlaceholder: "Search rate...",
  allStatuses: "All statuses",
  noRates: "No rates found.",
  pageOf: "Page {page} of {total}",

  status: {
    active: "Active",
    inactive: "Inactive",
  },

  columns: {
    name: "Rate Name",
    rate: "Rate",
    description: "Description",
    status: "Status",
    action: "Action",
  },

  dialogs: {
    addTitle: "Add Rate",
    editTitle: "Edit Rate",
    deleteTitle: "Delete Rate",
  },

  fields: {
    name: "Rate Name",
    percentage: "Percentage Number",
    description: "Description",
    status: "Status",
  },

  placeholders: {
    name: "Example: 2D 100%",
    description: "Enter rate description",
  },

  deleteQuestion: "Delete {name}?",
  deleteWarning:
    "This rate will be permanently removed.",

  messages: {
    created: "Rate created successfully",
    updated: "Rate updated successfully",
    deleted: "Rate deleted successfully",
  },

  errors: {
    fetch: "Could not fetch rates",
    save: "Could not save rate",
    delete: "Could not delete rate",
    idMissing: "Rate ID was not found",
    nameRequired: "Rate name is required",
    numberRequired: "Rate number is required",
    numberNegative:
      "Rate number cannot be negative",
  },
},

 user: {
  title: "Users",
  add: "Add",
  search: "Search",
  reset: "Reset",
  edit: "Edit",
  delete: "Delete",
  cancel: "Cancel",
  create: "Create",
  update: "Update",

  searchPlaceholder: "Search name or email...",
  allRoles: "All roles",
  noUsers: "No users found.",
  created: "Created",
  pageOf: "Page {page} of {total}",

  columns: {
    name: "Name",
    email: "Email",
    role: "Role",
    created: "Created",
    action: "Action",
  },

  roles: {
    user: "User",
    admin: "Administrator",
  },

  dialogs: {
    addTitle: "Add User",
    editTitle: "Edit User",
    deleteTitle: "Delete User",
  },

  fields: {
    name: "Name",
    email: "Email",
    password: "Password",
    role: "Role",
  },

  placeholders: {
    name: "Enter name",
    email: "Enter email",
    password: "Enter password",
    keepPassword: "Leave blank to keep current password",
    role: "Select role",
  },

  passwordHint:
    "Leave the password empty when it should not be changed.",

  passwordStrength: {
    prompt: "Enter a password",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  },

  deleteQuestion: "Delete {name}?",
  deleteWarning:
    "This user will no longer be able to sign in.",

  messages: {
    created: "User created successfully",
    updated: "User updated successfully",
    deleted: "User deleted successfully",
  },

  errors: {
    fetch: "Could not fetch users",
    save: "Could not save user",
    delete: "Could not delete user",
    idMissing: "User ID was not found",

    nameRequired: "Name is required",
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email",
    passwordRequired: "Password is required",
    passwordMin:
      "Password must be at least 6 characters",
    roleInvalid: "Please select a valid role",
  },
},
category: {
  title: "Categories",

  add: "Add",
  search: "Search",
  reset: "Reset",
  edit: "Edit",
  delete: "Delete",
  cancel: "Cancel",
  create: "Create",
  update: "Update",

  searchPlaceholder: "Search category...",
  allStatuses: "All statuses",
  noCategories: "No categories found.",
  created: "Created",
  pageOf: "Page {page} of {total}",

  status: {
    active: "Active",
    inactive: "Inactive",
  },

  columns: {
    name: "Category Name",
    description: "Description",
    status: "Status",
    created: "Created",
    action: "Action",
  },

  dialogs: {
    addTitle: "Add Category",
    editTitle: "Edit Category",
    deleteTitle: "Delete Category",
  },

  fields: {
    name: "Category Name",
    description: "Description",
    status: "Status",
  },

  placeholders: {
    name: "Enter category name",
    description: "Enter category description",
  },

  deleteQuestion: "Delete {name}?",
  deleteWarning:
    "A category assigned to a product or invoice cannot be deleted.",

  messages: {
    created: "Category created successfully",
    updated: "Category updated successfully",
    deleted: "Category deleted successfully",
  },

  errors: {
    fetch: "Could not fetch categories",
    save: "Could not save category",
    delete: "Could not delete category",
    idMissing: "Category ID was not found",
    nameRequired: "Category name is required",
  },
},
invoice: {
  title: "Invoice List",
  addInvoice: "Add Invoice",
  search: "Search",
  showFilters: "Show filters",
  reset: "Reset",
  resetFilters: "Reset filters",
  apply: "Apply",
  view: "View",
  printButton: "Print",
  edit: "Edit",
  delete: "Delete",
  close: "Close",
  cancel: "Cancel",
  createInvoice: "Create Invoice",
  updateInvoice: "Update Invoice",

  searchInvoices: "Search invoices...",
  searchInvoiceOrRow: "Search invoice or row...",
  allCategories: "All categories",
  allProducts: "All products",
  invoiceDateRange: "Invoice date range",
  selectDateRange: "Select date range",
  loadingInvoices: "Loading invoices...",
  loadingInvoice: "Loading invoice...",
  noInvoices: "No invoices found.",
  noRows: "No rows found.",
  pageOf: "Page {page} of {total}",
  previousPage: "Previous page",
  nextPage: "Next page",
  rowNumber: "Row {number}",

  columns: {
    number: "No.",
    invoiceName: "Invoice Name",
    category: "Category",
    product: "Product",
    customer: "Customer",
    invoiceDate: "Invoice Date",
    action: "Action",
  },

  dialogs: {
    createTitle: "Create Invoice",
    editTitle: "Edit Invoice",
    detailsTitle: "Invoice Details",
    deleteTitle: "Delete Invoice",
  },

  sections: {
    information: "Invoice Information",
    rows: "Invoice Rows",
  },

  fields: {
    invoiceName: "Invoice Name",
    invoiceDate: "Invoice Date",
    date: "Date",
    customer: "Customer",
    category: "Category",
    product: "Product",
    twoDigitRate: "2D Rate",
    threeDigitRate: "3D Rate",
    rowName: "Row Name",
    twoDigitNumber: "2D Number",
    twoDigitAmount: "2D Amount",
    correctTwoDigit: "Correct 2D",
    threeDigitNumber: "3D Number",
    threeDigitAmount: "3D Amount",
    correctThreeDigit: "Correct 3D",
    grandTotal: "Grand Total",
  },

  placeholders: {
    invoiceName: "Enter invoice name",
    customer: "Select customer",
    searchCustomer: "Search customer",
    category: "Select category",
    product: "Select product",
    searchProduct: "Search product",
    twoDigitRate: "2D rate",
    threeDigitRate: "3D rate",
    rowName: "Example: 56>70",
    amount: "Amount",
    type: "Type",
  },

  rowsHint: "Add one or more 2D or 3D rows.",
  addRow: "Add Row",
  invoiceRow: "Invoice Row",
  duplicateRow: "Duplicate row",
  removeRow: "Remove row",
  enableTwoDigit: "Enable 2D values",
  enableThreeDigit: "Enable 3D values",
  calculatedAutomatically: "Calculated automatically",
  copySuffix: "Copy",
  deleteQuestion: "Delete this invoice?",

  print: {
    serial: "No.",
    rowTitle: "Row Name",
    twoDigit: "2D",
    threeDigit: "3D",
    correctTwoDigit: "Correct 2D",
    correctThreeDigit: "Correct 3D",
    total: "Total",
    preparing: "Preparing invoice...",
    prepareError:
      "Could not prepare this invoice for printing.",
  },

  messages: {
    created: "Invoice created successfully",
    updated: "Invoice updated successfully",
    deleted: "Invoice deleted successfully",
  },

  errors: {
    dataNotFound: "Invoice data was not found",

    popupBlocked:
      "Print popup was blocked. Please allow popups and try again.",

    print: "Could not print invoice",
    fetch: "Could not fetch invoices",
    detail: "Could not load invoice details",
    save: "Could not save invoice",
    delete: "Could not delete invoice",

    titleRequired: "Invoice name is required",
    categoryRequired: "Category is required",
    productRequired: "Product is required",
    customerRequired: "Customer is required",
    dateRequired: "Invoice date is required",

    invalidTwoDigitRate:
      "Please select a valid 2D rate",

    invalidThreeDigitRate:
      "Please select a valid 3D rate",

    selectedProductInvalid:
      "Selected product is invalid",

    atLeastOneRow:
      "At least one row is required",

    rowNameRequired:
      "Row {row}: Row name is required",

    twoDigitRequired:
      "Row {row}: 2D number is required",

    twoDigitRange:
      "Row {row}: 2D number must be between 0 and 99",

    twoDigitAmountNegative:
      "Row {row}: 2D amount cannot be negative",

    twoDigitTypeNegative:
      "Row {row}: 2D type cannot be negative",

    threeDigitRequired:
      "Row {row}: 3D number is required",

    threeDigitRange:
      "Row {row}: 3D number must be between 0 and 999",

    threeDigitAmountNegative:
      "Row {row}: 3D amount cannot be negative",

    threeDigitTypeNegative:
      "Row {row}: 3D type cannot be negative",
  },
},
dashboard: {
  title: "Dashboard",
  subtitle:
    "Choose a section to manage your system.",

  cards: {
    invoices: "Invoice List",
    customers: "Customer List",
    products: "Product List",
    categories: "Category List",
    rates: "Rate List",
    users: "User List",
  },
},
profile: {
  title: 'Profile',

  subtitle:
    'Manage your personal information and password',

  loading:
    'Loading profile...',

  save:
    'Save Changes',

  fields: {
    name: 'Name',
    email: 'Email',
    currentPassword:
      'Current Password',
    newPassword:
      'New Password',
    confirmPassword:
      'Confirm Password'
  },

  placeholders: {
    name:
      'Enter your name',

    email:
      'Enter your email address',

    currentPassword:
      'Enter current password',

    newPassword:
      'Enter new password',

    confirmPassword:
      'Enter new password again'
  },

  changePassword: {
    title:
      'Change Password',

    description:
      'Leave these fields empty when you do not want to change your password.'
  },

  messages: {
    updated:
      'Profile updated successfully'
  },

  errors: {
    load:
      'Could not load profile',

    update:
      'Could not update profile',

    nameRequired:
      'Name is required',

    emailRequired:
      'Email is required',

    emailInvalid:
      'Please enter a valid email address',

    currentPasswordRequired:
      'Current password is required',

    newPasswordRequired:
      'New password is required',

    newPasswordMin:
      'New password must be at least 6 characters',

    confirmPasswordRequired:
      'Confirm password is required',

    confirmPasswordMismatch:
      'Confirm password does not match',

    passwordMustBeDifferent:
      'New password must be different from the current password'
  }
},
login: {
  title: 'Login',

  fields: {
    identifier:
      'Username or email',

    password:
      'Password'
  },

  placeholders: {
    identifier:
      'Enter username or email',

    password:
      'Enter password'
  },

  loginButton:
    'Login',

  noAccount:
    'No account?',

  registerHere:
    'Register here',

  messages: {
    successTitle:
      'Success',

    successDetail:
      'Logged in successfully',

    failedTitle:
      'Login failed'
  },

  errors: {
    invalidCredentials:
      'Invalid username, email, or password'
  }
}
};