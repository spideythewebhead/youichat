import React, { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ElevatedButton } from '../components/Button';
import { Card, CardTitle } from '../components/Card';
import { Column } from '../components/Flex';
import { InputField } from '../components/InputField';
import { client } from '../db';

export function SignUpPage() {
  const { control, handleSubmit, formState, getValues } = useForm({
    mode: 'all',
  });

  const onSubmit = useCallback(
    async (data: {
      email: string;
      password: string;
      repeatPassword: string;
    }) => {
      const { user, error } = await client.auth.signUp(data);

      if (error) {
        console.log('something went wrong', error);
        return;
      }
    },
    []
  );

  return (
    <Column mainAxis="justify-center" className="mx-2">
      <Card>
        <CardTitle title="Sign Up!" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Column className="space-y-2" crossAxis="items-stretch">
            <Controller
              control={control}
              name="email"
              rules={{
                required: {
                  value: true,
                  message: 'This field is required.',
                },
                maxLength: {
                  value: 30,
                  message: 'Max length is reached.',
                },
                max: 30,
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Invalid email.',
                },
              }}
              render={({ field, fieldState }) => (
                <InputField
                  type="text"
                  placeholder="Email"
                  {...field}
                  error={fieldState.error?.message}
                />
              )}
            ></Controller>

            <Controller
              control={control}
              name="password"
              rules={{
                required: {
                  value: true,
                  message: 'This field is required.',
                },
                minLength: {
                  value: 6,
                  message: 'Min 6 length.',
                },
              }}
              render={({ field, fieldState }) => (
                <InputField
                  type="password"
                  placeholder="Password"
                  {...field}
                  error={fieldState.error?.message}
                />
              )}
            ></Controller>

            <Controller
              control={control}
              name="repeatPassword"
              rules={{
                required: {
                  value: true,
                  message: 'This field is required.',
                },
                minLength: {
                  value: 6,
                  message: 'Min 6 length.',
                },
                validate: (current) => {
                  return current !== getValues('password')
                    ? 'Passwords dont match'
                    : undefined;
                },
              }}
              render={({ field, fieldState }) => (
                <InputField
                  type="password"
                  placeholder="Repeat Password"
                  {...field}
                  error={fieldState.error?.message}
                />
              )}
            ></Controller>

            <ElevatedButton type="submit" disabled={!formState.isValid}>
              Register
            </ElevatedButton>
          </Column>
        </form>
      </Card>
    </Column>
  );
}
