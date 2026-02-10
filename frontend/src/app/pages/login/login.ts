import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  username = '';
  password = '';

  constructor(private router: Router) {}

  onLogin() {
    console.log('Attempting to login with:', this.username);
    this.router.navigate(['/dashboard']);
    // This is where your fetch() or HttpClient call to Go will go
  }
}
