import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';
import { debounceTime } from 'rxjs/operators'
import { Customer } from './customer';


function ratingRange(min: number, max: number): ValidatorFn {

  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && (isNaN(c.value) || c.value < min || c.value > max)) {
      return { 'range': true };
    }
    return null
  }
}

function compareEmails(c: AbstractControl): { [key: string]: boolean } | null {
  const email = c.get('email');
  const confirmEmail = c.get('confirmEmail');
  if (email.value !== confirmEmail.value) {
    return { 'match': true };
  }

  if (email.pristine || confirmEmail.pristine) {
    return null;
  }

  return null;
}



@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm: FormGroup;
  customer = new Customer();
  myControl: FormControl;
  emailMessage: string;

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required]],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', [Validators.required]],
      }, { validator: compareEmails }),
      phone: [''],
      notification: 'email',
      rating: [null, [ratingRange(1, 5)]],
      sendCatalog: [''],
      addresses: this.fb.array([this.buildAddress()])
    });



    this.customerForm.get('notification').valueChanges.subscribe({

      next: (value) => this.setNotification(value)
    })

    console.log(this.customerForm.value)

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe({
      next: (value) => this.setMessage(emailControl)
    })

  }

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(
        key => this.validationMessages[key]).join(' ');
    }
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData() {

    this.customerForm.patchValue({
      firstName: 'Test',
      lastName: 'Last',
      email: 'ahmed@gmail.com',
      sendCatalog: false
    })
  }

  setNotification(notifyVia: string): void {

    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required)
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }
}
