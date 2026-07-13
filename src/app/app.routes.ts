import { ApplicationsAddformComponent } from './pages/applications-addform/applications-addform.component';
import { ApplicationsComponent } from './pages/applications/applications.component';
import { CriticalLogsComponent } from './pages/critical-logs/critical-logs.component';
import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { ResetComponent } from './pages/auth-pages/reset/reset.component';
import { OtpCodeComponent } from './pages/auth-pages/otp-code/otp-code.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { NewPasswordComponent } from './pages/auth-pages/new-password/new-password.component';
import { ApplicationDetailsComponent } from './pages/application-details/application-details.component'; // ✅ importer le composant
import { LogsComponent } from './pages/logs/logs.component';
import { LogDetailsComponent } from './pages/log-details/log-details.component';
import { UsersComponent } from './pages/users/users.component';
import { UserDetailsComponent } from './pages/user-details/user-details.component';
import { UserAddformComponent } from './pages/user-addform/user-addform.component';
import { AdminGuard } from './core/guards/admin.guard';
import { MyApplicationsComponent } from './pages/my-applications/my-applications.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guestGuard';


export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],           // ← Tout le monde doit être connecté
    children: [
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Angular Calendar | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'applications',
        component: ApplicationsComponent,
        title: 'Angular Applications Dashboard | TailAdmin - Angular Admin Dashboard Template' ,
       // canActivate: [AdminGuard]
      },
        {
        path: 'applications-addform',
        component: ApplicationsAddformComponent,
        title: 'Add Application',
        canActivate: [AdminGuard ]
        
      },
        {
        path: 'applications-editform/:id',
        component: ApplicationsAddformComponent,
        title: 'Edit Application',
        canActivate: [AdminGuard]
      },
        {
        path: 'applications-details/:id', // ✅ route avec paramètre
        component: ApplicationDetailsComponent,
        title: 'Angular Applications Details | TailAdmin - Angular Admin Dashboard Template'
      },
         {
        path: 'logs/:id', // ✅ route avec paramètre
        component: LogsComponent,
        title: 'Angular Logs Details | TailAdmin - Angular Admin Dashboard Template'
      },
        {
        path: 'logdetails/:id', // ✅ route avec paramètre
        component: LogDetailsComponent,
        title: 'Angular Log Details | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'usersList', // ✅ route avec paramètre
        component: UsersComponent,
        title: 'Angular Users List | TailAdmin - Angular Admin Dashboard Template'
      },
       {
        path: 'user-details/:id', // ✅ route avec paramètre
        component: UserDetailsComponent,
        title: 'Angular Users details | TailAdmin - Angular Admin Dashboard Template'
      },
       {
        path: 'user-addform', // ✅ route avec paramètre
        component: UserAddformComponent,
        title: 'create'
      },
       {
        path: 'user-updateform/:id', // ✅ route avec paramètre
        component: UserAddformComponent,
        title: 'edit'
      },
       {
        path: 'myapplications',
        component: MyApplicationsComponent,
        title: 'My Applications'
      },
      {
        path: 'critical-logs',
        component: CriticalLogsComponent,
        title: 'Logs Critiques | TailAdmin'
      },


    ]
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Angular Sign In Dashboard | TailAdmin - Angular Admin Dashboard Template' , 
    canActivate: [guestGuard]

  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path: 'reset-password',
    component: ResetComponent,
    title: 'Angular Reset Password Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path: 'otp-code',
    component: OtpCodeComponent,
    title: 'Angular OTP Verification Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },

   {
        path: 'new-password', // ✅ nouvelle route
        component: NewPasswordComponent,
        title: 'Angular Change Password | TailAdmin - Angular Admin Dashboard Template'
  },
  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
